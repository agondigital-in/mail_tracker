import type { Job } from "agenda";
import { Campaign, Email, Recipient } from "@/db/models";
import { sendEmail } from "./email.service";
import { processVariables } from "./template.service";
import agenda from "@/lib/agenda";

interface CampaignJobData {
	campaignId: string;
}

/**
 * Get active recipients from campaign's recipient lists (optimized)
 * Sorted based on campaign's sortOrder preference
 */
async function getActiveRecipients(campaign: {
	recipientListIds: string[];
	schedule?: {
		sortOrder?: "newest" | "oldest";
	};
}) {
	// Determine sort order (default: newest first)
	const sortOrder = campaign.schedule?.sortOrder === "oldest" ? 1 : -1;

	// Single query with filter - more efficient than filtering in memory
	const recipients = await Recipient.find({
		recipientListId: { $in: campaign.recipientListIds },
		unsubscribed: false,
	})
		.sort({ createdAt: sortOrder }) // Sort by creation date
		.lean(); // Use lean() for better performance

	return recipients;
}

/**
 * Check if campaign is paused
 */
async function checkPauseStatus(campaignId: string): Promise<boolean> {
	const campaign = await Campaign.findById(campaignId);
	return campaign?.status === "paused";
}



/**
 * Handle send error
 */
async function handleSendError(
	campaignId: string,
	recipientEmail: string,
	error: string,
) {
	await Campaign.findByIdAndUpdate(campaignId, {
		$push: {
			failedRecipients: {
				email: recipientEmail,
				error,
				timestamp: new Date(),
			},
		},
		$inc: {
			failedCount: 1,
			remainingCount: -1,
		},
	});
}

/**
 * Process template variables for a recipient
 */
function processTemplate(
	html: string,
	recipient: {
		email: string;
		name?: string;
		customFields?: Map<string, unknown>;
	},
): string {
	const recipientData: Record<string, string | number | boolean> = {
		email: recipient.email,
		name: recipient.name || "",
	};

	// Add custom fields
	if (recipient.customFields) {
		for (const [key, value] of recipient.customFields.entries()) {
			if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
				recipientData[key] = value;
			}
		}
	}

	return processVariables(html, recipientData);
}

/**
 * Main campaign job processor (optimized)
 */
export async function processCampaign(job: Job<CampaignJobData>) {
	const { campaignId } = job.attrs.data;

	try {
		// Load campaign
		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			throw new Error("Campaign not found");
		}

		// Get active recipients (single optimized query)
		const activeRecipients = await getActiveRecipients(campaign);

		if (activeRecipients.length === 0) {
			await Campaign.findByIdAndUpdate(campaignId, {
				status: "completed",
				completedAt: new Date(),
			});
			return;
		}

		// Update status and counts in single query
		await Campaign.findByIdAndUpdate(campaignId, {
			status: "processing",
			sentAt: new Date(),
			totalRecipients: activeRecipients.length,
			remainingCount: activeRecipients.length,
		});

		// Distribute recipients to mail servers
		const { recipientsByServer } = distributeToServers(
			activeRecipients,
			campaign.mailServers,
		);

		// Send emails with delay (optimized with batch updates)
		for (const [serverIndex, recipients] of recipientsByServer.entries()) {
			const serverConfig = campaign.mailServers[serverIndex];
			let batchSuccessCount = 0;

			for (const recipient of recipients as Array<{
				email: string;
				name?: string;
				customFields?: Map<string, unknown>;
			}>) {
				// Check if paused every 10 emails (reduce DB calls)
				if (batchSuccessCount % 10 === 0) {
					const isPaused = await checkPauseStatus(campaignId);
					if (isPaused) {
						return; // Exit job, will be resumed later
					}
				}

				try {
					// Process template
					const processedHtml = processTemplate(
						campaign.htmlContent,
						recipient,
					);
					const processedSubject = processTemplate(campaign.subject, recipient);

					// Send email (automatically creates Email record with tracking)
					await sendEmail({
						userId: campaign.userId,
						to: recipient.email,
						subject: processedSubject,
						html: processedHtml,
						campaignId: campaign._id.toString(),
						recipientId: (recipient as { _id?: unknown })._id?.toString(),
						smtpServerId: serverConfig.serverId.toString(),
					});

					batchSuccessCount++;

					// Batch update every 10 successful sends
					if (batchSuccessCount % 10 === 0) {
						await Campaign.findByIdAndUpdate(campaignId, {
							$inc: {
								sentCount: 10,
								remainingCount: -10,
								[`mailServers.${serverIndex}.sent`]: 10,
							},
						});
					}

					// Apply delay
					if (campaign.delay > 0) {
						await new Promise((resolve) =>
							setTimeout(resolve, campaign.delay * 1000),
						);
					}
				} catch (error) {
					// Track failed email in Email collection
					const recipientWithId = recipient as { _id?: unknown };
					if (recipientWithId._id) {
						await Email.create({
							userId: campaign.userId,
							campaignId: campaign._id,
							recipientId: recipientWithId._id,
							trackingId: `failed-${Date.now()}-${Math.random()}`,
							to: recipient.email,
							from: campaign.from || "",
							subject: campaign.subject,
							htmlContent: campaign.htmlContent,
							status: "failed",
							error: error instanceof Error ? error.message : "Unknown error",
							smtpServerId: serverConfig.serverId,
							sentAt: new Date(),
							bounced: false,
							uniqueOpens: 0,
							uniqueClicks: 0,
							totalOpens: 0,
							totalClicks: 0,
						}).catch(() => {
							// Ignore duplicate key errors
						});
					}

					// Handle send error
					await handleSendError(
						campaignId,
						recipient.email,
						error instanceof Error ? error.message : "Unknown error",
					);
				}
			}

			// Update remaining count for this server
			const remainder = batchSuccessCount % 10;
			if (remainder > 0) {
				await Campaign.findByIdAndUpdate(campaignId, {
					$inc: {
						sentCount: remainder,
						remainingCount: -remainder,
						[`mailServers.${serverIndex}.sent`]: remainder,
					},
				});
			}
		}

		// Mark campaign as completed
		await Campaign.findByIdAndUpdate(campaignId, {
			status: "completed",
			completedAt: new Date(),
		});
	} catch (error) {
		// Mark campaign as failed
		await Campaign.findByIdAndUpdate(campaignId, {
			$set: {
				status: "failed",
				completedAt: new Date(),
			},
		});

		throw error;
	}
}

/**
 * Distribute recipients to mail servers based on limits
 */
export function distributeToServers(
	recipients: unknown[],
	mailServers: Array<{ serverId: unknown; limit: number; sent: number }>,
): {
	recipientsByServer: Map<number, unknown[]>;
} {
	const recipientsByServer = new Map<number, unknown[]>();

	// Initialize arrays for each server
	for (let i = 0; i < mailServers.length; i++) {
		recipientsByServer.set(i, []);
	}

	let currentServerIndex = 0;

	for (const recipient of recipients) {
		// Find next available server
		let assigned = false;

		for (let i = 0; i < mailServers.length; i++) {
			const serverIndex = (currentServerIndex + i) % mailServers.length;
			const server = mailServers[serverIndex];
			const currentRecipients = recipientsByServer.get(serverIndex) || [];

			// Check if server has capacity
			if (currentRecipients.length < server.limit) {
				currentRecipients.push(recipient);
				recipientsByServer.set(serverIndex, currentRecipients);
				currentServerIndex = (serverIndex + 1) % mailServers.length;
				assigned = true;
				break;
			}
		}

		// If no server has capacity, stop
		if (!assigned) {
			break;
		}
	}

	return { recipientsByServer };
}

/**
 * Send batch of emails with delay and track in SentEmail collection
 */
export async function sendBatch(
	recipients: Array<{
		_id?: unknown;
		email: string;
		name?: string;
		customFields?: Map<string, unknown>;
	}>,
	serverConfig: { serverId: string; limit: number },
	campaignId: string,
	userId: string,
	subject: string,
	htmlContent: string,
	delay: number,
) {
	for (const recipient of recipients) {
		try {
			// Process template
			const processedHtml = processTemplate(htmlContent, recipient);
			const processedSubject = processTemplate(subject, recipient);

			// Send email (automatically creates Email record)
			await sendEmail({
				userId,
				to: recipient.email,
				subject: processedSubject,
				html: processedHtml,
				campaignId,
				recipientId: recipient._id?.toString(),
				smtpServerId: serverConfig.serverId,
			});

			// Apply delay
			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay * 1000));
			}
		} catch (error) {
			// Track failed email in Email collection
			if (recipient._id) {
				await Email.create({
					userId,
					campaignId,
					recipientId: recipient._id,
					trackingId: `failed-${Date.now()}-${Math.random()}`,
					to: recipient.email,
					from: "", // Will be filled by campaign
					subject,
					htmlContent,
					status: "failed",
					error: error instanceof Error ? error.message : "Unknown error",
					smtpServerId: serverConfig.serverId,
					sentAt: new Date(),
					bounced: false,
					uniqueOpens: 0,
					uniqueClicks: 0,
					totalOpens: 0,
					totalClicks: 0,
				}).catch(() => {
					// Ignore duplicate key errors
				});
			}

			await handleSendError(
				campaignId,
				recipient.email,
				error instanceof Error ? error.message : "Unknown error",
			);
		}
	}
}

/**
 * Define Agenda jobs
 */
export function defineAgendaJobs() {
	agenda.define("process-bulk-campaign", processCampaign);
	agenda.define("process-recurring-campaign", processRecurringCampaign);
}

/**
 * Process recurring campaign (optimized)
 */
async function processRecurringCampaign(job: Job<CampaignJobData>) {
	const { campaignId } = job.attrs.data;

	try {
		const campaign = await Campaign.findById(campaignId);
		if (!campaign) {
			throw new Error("Campaign not found");
		}

		// Check if campaign should continue
		if (
			campaign.schedule?.endDate &&
			new Date() > campaign.schedule.endDate
		) {
			await Campaign.findByIdAndUpdate(campaignId, {
				status: "completed",
				completedAt: new Date(),
			});
			return;
		}

		// Get active recipients (optimized single query)
		const allRecipients = await getActiveRecipients(campaign);

		// Get already sent recipient IDs from Email collection (prevent duplicates)
		const sentEmails = await Email.find(
			{ campaignId: campaign._id, status: "sent" },
			{ recipientId: 1 },
		).lean();

		const sentRecipientIds = new Set(
			sentEmails.map((sent) => sent.recipientId?.toString()).filter(Boolean),
		);

		// Filter out recipients who already received email
		const pendingRecipients = allRecipients.filter((recipient: unknown) => {
			const rec = recipient as { _id?: { toString: () => string } };
			return rec._id && !sentRecipientIds.has(rec._id.toString());
		});

		// Get batch size
		const batchSize = campaign.schedule?.batchSize || 100;

		// Take next batch from pending recipients
		const batch = pendingRecipients.slice(0, batchSize);

		if (batch.length === 0) {
			// All recipients processed, mark as completed
			await Campaign.findByIdAndUpdate(campaignId, {
				status: "completed",
				completedAt: new Date(),
			});
			return;
		}

		// Reset server sent counts for new execution (daily/weekly/monthly reset)
		const resetMailServers = campaign.mailServers.map((server: {
			serverId: unknown;
			limit: number;
			sent: number;
		}) => ({
			serverId: server.serverId,
			limit: server.limit,
			sent: 0, // Reset sent count for this execution
		}));

		// Process batch
		const { recipientsByServer } = distributeToServers(
			batch,
			resetMailServers,
		);

		let totalSent = 0;

		for (const [serverIndex, recipients] of recipientsByServer.entries()) {
			const serverConfig = resetMailServers[serverIndex];

			await sendBatch(
				recipients as Array<{
					email: string;
					name?: string;
					customFields?: Map<string, unknown>;
				}>,
				{
					serverId: serverConfig.serverId.toString(),
					limit: serverConfig.limit,
				},
				campaign._id.toString(),
				campaign.userId,
				campaign.subject,
				campaign.htmlContent,
				campaign.delay,
			);

			totalSent += recipients.length;

			// Update server sent count for this execution
			resetMailServers[serverIndex].sent += recipients.length;
		}

		// Update campaign with reset server counts
		await Campaign.findByIdAndUpdate(campaignId, {
			$set: {
				mailServers: resetMailServers,
			},
		});

		// Update campaign progress in single query
		await Campaign.findByIdAndUpdate(campaignId, {
			$inc: {
				sentCount: totalSent,
			},
			$set: {
				remainingCount: pendingRecipients.length - totalSent,
				"schedule.lastExecutedAt": new Date(),
			},
		});

		// Schedule next execution
		if (campaign.schedule?.frequency && campaign.remainingCount > 0) {
			const nextDate = calculateNextExecutionDate(
				new Date(),
				campaign.schedule.frequency,
			);

			await agenda.schedule(nextDate, "process-recurring-campaign", {
				campaignId: campaign._id.toString(),
			});
		}
	} catch (error) {
		await Campaign.findByIdAndUpdate(campaignId, {
			$set: {
				status: "failed",
				completedAt: new Date(),
			},
		});

		throw error;
	}
}

/**
 * Calculate next execution date for recurring campaigns
 */
function calculateNextExecutionDate(
	currentDate: Date,
	frequency: "daily" | "weekly" | "monthly",
): Date {
	const nextDate = new Date(currentDate);

	switch (frequency) {
		case "daily":
			nextDate.setDate(nextDate.getDate() + 1);
			break;
		case "weekly":
			nextDate.setDate(nextDate.getDate() + 7);
			break;
		case "monthly":
			nextDate.setMonth(nextDate.getMonth() + 1);
			break;
	}

	return nextDate;
}
