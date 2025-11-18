import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { addRecipient } from "@/services/recipient.service";

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

		// Parse request body
		const body = await request.json();
		const { listId, email, name, customFields } = body;

		// Validate input
		if (!listId || !email) {
			return NextResponse.json(
				{
					success: false,
					error: "List ID and email are required",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Add recipient
		const recipient = await addRecipient(userId, {
			listId,
			email,
			name,
			customFields,
		});

		return NextResponse.json({
			success: true,
			recipientId: recipient._id.toString(),
			recipient,
			message: "Recipient added successfully",
		});
	} catch (error) {
		console.error("Error adding recipient:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to add recipient",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
