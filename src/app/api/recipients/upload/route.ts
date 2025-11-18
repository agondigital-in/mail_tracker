import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadRecipients } from "@/services/recipient.service";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json(
				{
					success: false,
					error: "Authentication required",
					code: "AUTH_REQUIRED",
				},
				{ status: 401 },
			);
		}

		const userId = session.user.id;

		// Parse form data
		const formData = await request.formData();
		const file = formData.get("file") as File;
		const listId = formData.get("listId") as string;

		// Validate input
		if (!file || !listId) {
			return NextResponse.json(
				{
					success: false,
					error: "File and list ID are required",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Check file size (10MB limit)
		const maxSize = (Number.parseInt(process.env.MAX_FILE_SIZE_MB || "10")) * 1024 * 1024;
		if (file.size > maxSize) {
			return NextResponse.json(
				{
					success: false,
					error: `File size exceeds ${process.env.MAX_FILE_SIZE_MB || "10"}MB limit`,
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Upload recipients
		const result = await uploadRecipients(userId, listId, buffer, file.name);

		return NextResponse.json({
			success: true,
			added: result.added,
			skipped: result.skipped,
			errors: result.errors,
			message: `Successfully added ${result.added} recipients. Skipped ${result.skipped}.`,
		});
	} catch (error) {
		console.error("Error uploading recipients:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to upload recipients",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
