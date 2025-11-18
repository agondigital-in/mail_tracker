import { Recipient, RecipientList } from "@/db/models";
import * as XLSX from "xlsx";
import Papa from "papaparse";
import crypto from "node:crypto";

interface AddRecipientData {
	listId: string;
	email: string;
	name?: string;
	customFields?: Record<string, unknown>;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Check if email already exists in the list
 */
export async function checkDuplicate(
	listId: string,
	email: string,
): Promise<boolean> {
	const existing = await Recipient.findOne({
		recipientListId: listId,
		email: email.toLowerCase(),
	});
	return !!existing;
}

/**
 * Add a single recipient to a list
 */
export async function addRecipient(userId: string, data: AddRecipientData) {
	// Validate email format
	if (!validateEmail(data.email)) {
		throw new Error("Invalid email format");
	}

	// Verify list ownership
	const list = await RecipientList.findOne({
		_id: data.listId,
		userId,
	});

	if (!list) {
		throw new Error("Recipient list not found or unauthorized");
	}

	// Check for duplicates
	const isDuplicate = await checkDuplicate(data.listId, data.email);
	if (isDuplicate) {
		throw new Error("Email already exists in this list");
	}

	// Create recipient
	const recipient = await Recipient.create({
		recipientListId: data.listId,
		email: data.email.toLowerCase(),
		name: data.name,
		customFields: data.customFields || {},
		unsubscribed: false,
	});

	return recipient;
}

/**
 * Remove a recipient from a list
 */
export async function removeRecipient(recipientId: string, userId: string) {
	// Get recipient
	const recipient = await Recipient.findById(recipientId);
	if (!recipient) {
		throw new Error("Recipient not found");
	}

	// Verify list ownership
	const list = await RecipientList.findOne({
		_id: recipient.recipientListId,
		userId,
	});

	if (!list) {
		throw new Error("Unauthorized to remove this recipient");
	}

	// Delete recipient
	await Recipient.deleteOne({ _id: recipientId });

	return { success: true };
}

/**
 * Get active (non-unsubscribed) recipients from lists
 */
export async function getActiveRecipients(listIds: string[]) {
	const recipients = await Recipient.find({
		recipientListId: { $in: listIds },
		unsubscribed: false,
	});

	return recipients;
}

/**
 * Get all recipients from a list
 */
export async function getListRecipients(listId: string) {
	const recipients = await Recipient.find({
		recipientListId: listId,
	}).sort({ createdAt: -1 });

	return recipients;
}

/**
 * Parse CSV file and extract recipients
 */
export async function parseCSV(
	fileBuffer: Buffer,
): Promise<Array<{ email: string; name?: string; customFields?: Record<string, unknown> }>> {
	return new Promise((resolve, reject) => {
		const fileContent = fileBuffer.toString("utf-8");

		Papa.parse(fileContent, {
			header: true,
			skipEmptyLines: true,
			complete: (results) => {
				const recipients = (results.data as Record<string, unknown>[]).map((row) => {
					const email = (row.email || row.Email || row.EMAIL) as string;
					const name = (row.name || row.Name || row.NAME) as string | undefined;

					// Extract custom fields (all fields except email and name)
					const customFields: Record<string, unknown> = {};
					for (const [key, value] of Object.entries(row)) {
						const lowerKey = key.toLowerCase();
						if (lowerKey !== "email" && lowerKey !== "name") {
							customFields[key] = value;
						}
					}

					return {
						email,
						name,
						customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
					};
				});

				resolve(recipients);
			},
			error: (error: Error) => {
				reject(new Error(`CSV parsing error: ${error.message}`));
			},
		});
	});
}

/**
 * Parse Excel file and extract recipients from first sheet
 */
export async function parseExcel(
	fileBuffer: Buffer,
): Promise<Array<{ email: string; name?: string; customFields?: Record<string, unknown> }>> {
	try {
		const workbook = XLSX.read(fileBuffer, { type: "buffer" });
		const firstSheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[firstSheetName];

		// Convert to JSON
		const data = XLSX.utils.sheet_to_json(worksheet);

		const recipients = (data as Record<string, unknown>[]).map((row) => {
			const email = (row.email || row.Email || row.EMAIL) as string;
			const name = (row.name || row.Name || row.NAME) as string | undefined;

			// Extract custom fields
			const customFields: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(row)) {
				const lowerKey = key.toLowerCase();
				if (lowerKey !== "email" && lowerKey !== "name") {
					customFields[key] = value;
				}
			}

			return {
				email,
				name,
				customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
			};
		});

		return recipients;
	} catch (error) {
		throw new Error(`Excel parsing error: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}

/**
 * Upload recipients from file (CSV or Excel) - Optimized with bulk operations
 */
export async function uploadRecipients(
	userId: string,
	listId: string,
	fileBuffer: Buffer,
	fileName: string,
) {
	// Verify list ownership
	const list = await RecipientList.findOne({
		_id: listId,
		userId,
	});

	if (!list) {
		throw new Error("Recipient list not found or unauthorized");
	}

	// Parse file based on extension
	let parsedRecipients: Array<{ email: string; name?: string; customFields?: Record<string, unknown> }>;

	if (fileName.endsWith(".csv")) {
		parsedRecipients = await parseCSV(fileBuffer);
	} else if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
		parsedRecipients = await parseExcel(fileBuffer);
	} else {
		throw new Error("Unsupported file format. Please upload CSV or Excel file.");
	}

	// Get existing emails in one query (much faster than checking one by one)
	const existingEmails = new Set(
		(
			await Recipient.find(
				{ recipientListId: listId },
				{ email: 1 },
			).lean()
		).map((r) => r.email),
	);

	// Process recipients in batches with bulk insert
	const batchSize = 1000;
	let added = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (let i = 0; i < parsedRecipients.length; i += batchSize) {
		const batch = parsedRecipients.slice(i, i + batchSize);
		const validRecipients = [];

		for (const recipient of batch) {
			// Validate email
			if (!recipient.email || !validateEmail(recipient.email)) {
				errors.push(`Invalid email: ${recipient.email || "empty"}`);
				skipped++;
				continue;
			}

			const normalizedEmail = recipient.email.toLowerCase();

			// Check for duplicates (in-memory check - much faster)
			if (existingEmails.has(normalizedEmail)) {
				skipped++;
				continue;
			}

			// Add to valid list and mark as existing to prevent duplicates within file
			existingEmails.add(normalizedEmail);
			validRecipients.push({
				recipientListId: listId,
				email: normalizedEmail,
				name: recipient.name,
				customFields: recipient.customFields || {},
				unsubscribed: false,
			});
		}

		// Bulk insert valid recipients
		if (validRecipients.length > 0) {
			try {
				await Recipient.insertMany(validRecipients, { ordered: false });
				added += validRecipients.length;
			} catch (error) {
				// Handle bulk insert errors
				if (error && typeof error === "object" && "writeErrors" in error) {
					const writeErrors = (error as { writeErrors: Array<{ err: { errmsg: string } }> }).writeErrors;
					for (const err of writeErrors) {
						errors.push(err.err.errmsg);
					}
				}
				// Count successful inserts even if some failed
				const insertedCount = validRecipients.length - (error && typeof error === "object" && "writeErrors" in error ? (error as { writeErrors: unknown[] }).writeErrors.length : 0);
				added += insertedCount;
				skipped += validRecipients.length - insertedCount;
			}
		}
	}

	return {
		success: true,
		added,
		skipped,
		errors: errors.slice(0, 10), // Return first 10 errors only
	};
}


/**
 * Generate signed token for unsubscribe link
 */
export function generateUnsubscribeToken(recipientId: string): string {
	const secret = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";
	const data = `${recipientId}:${Date.now()}`;
	const hmac = crypto.createHmac("sha256", secret);
	hmac.update(data);
	const signature = hmac.digest("hex");
	return `${Buffer.from(data).toString("base64")}.${signature}`;
}

/**
 * Verify unsubscribe token
 */
export function verifyUnsubscribeToken(token: string): string | null {
	try {
		const secret = process.env.UNSUBSCRIBE_SECRET || "default-secret-change-me";
		const [dataBase64, signature] = token.split(".");

		if (!dataBase64 || !signature) {
			return null;
		}

		const data = Buffer.from(dataBase64, "base64").toString("utf-8");
		const [recipientId, timestamp] = data.split(":");

		// Verify signature
		const hmac = crypto.createHmac("sha256", secret);
		hmac.update(data);
		const expectedSignature = hmac.digest("hex");

		if (signature !== expectedSignature) {
			return null;
		}

		// Check if token is not too old (30 days)
		const tokenAge = Date.now() - Number.parseInt(timestamp, 10);
		const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

		if (tokenAge > maxAge) {
			return null;
		}

		return recipientId;
	} catch {
		return null;
	}
}

/**
 * Unsubscribe a recipient
 */
export async function unsubscribeRecipient(
	recipientId: string,
	token: string,
) {
	// Verify token
	const verifiedId = verifyUnsubscribeToken(token);
	if (!verifiedId || verifiedId !== recipientId) {
		throw new Error("Invalid or expired unsubscribe token");
	}

	// Get recipient
	const recipient = await Recipient.findById(recipientId);
	if (!recipient) {
		throw new Error("Recipient not found");
	}

	// Update unsubscribe status
	recipient.unsubscribed = true;
	recipient.unsubscribedAt = new Date();
	await recipient.save();

	return { success: true, email: recipient.email };
}
