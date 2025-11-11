import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getEmailById } from "@/services/email.service";
import { OpenEvent, ClickEvent, BounceEvent } from "@/db/models";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		// Check authentication
		const session = await auth.api.getSession({ headers: request.headers });

		if (!session) {
			return NextResponse.json(
				{ success: false, error: "Authentication required", code: "AUTH_REQUIRED" },
				{ status: 401 },
			);
		}

		const userId = session.user.id;
		const { id } = await params;

		// Get email with authorization check
		const email = await getEmailById(id, userId);

		if (!email) {
			return NextResponse.json(
				{ success: false, error: "Email not found", code: "NOT_FOUND" },
				{ status: 404 },
			);
		}

		// Get all events for this email
		const [opens, clicks, bounce] = await Promise.all([
			OpenEvent.find({ emailId: email._id }).sort({ timestamp: -1 }),
			ClickEvent.find({ emailId: email._id }).sort({ timestamp: -1 }),
			BounceEvent.findOne({ emailId: email._id }),
		]);

		return NextResponse.json({
			success: true,
			email,
			opens,
			clicks,
			bounce: bounce || null,
		});
	} catch (error) {
		console.error("Error getting email details:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to get email details",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
