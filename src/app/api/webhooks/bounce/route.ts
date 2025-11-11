import { NextRequest, NextResponse } from "next/server";
import { logBounceEvent } from "@/services/bounce.service";

export async function POST(request: NextRequest) {
	try {
		// Validate webhook signature (if configured)
		const webhookSecret = process.env.WEBHOOK_SECRET;
		if (webhookSecret) {
			const signature = request.headers.get("x-webhook-signature");
			if (signature !== webhookSecret) {
				return NextResponse.json(
					{ success: false, error: "Invalid webhook signature" },
					{ status: 401 },
				);
			}
		}

		// Parse request body
		const body = await request.json();
		const { trackingId, email, reason, type } = body;

		// Validate required fields
		if (!trackingId || !email || !reason) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Log bounce event
		await logBounceEvent({
			trackingId,
			recipientEmail: email,
			reason,
			type,
			timestamp: new Date(),
		});

		return NextResponse.json({
			success: true,
			message: "Bounce event logged successfully",
		});
	} catch (error) {
		console.error("Error processing bounce webhook:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to process bounce event",
			},
			{ status: 500 },
		);
	}
}
