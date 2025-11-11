import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { sendEmail } from "@/services/email.service";

export async function POST(request: NextRequest) {
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

		// Parse request body
		const body = await request.json();
		const { to, subject, html, campaignId } = body;

		// Validate input
		if (!to || !subject || !html) {
			return NextResponse.json(
				{
					success: false,
					error: "Missing required fields: to, subject, html",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(to)) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid email address format",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Validate content size (max 1MB)
		if (html.length > 1024 * 1024) {
			return NextResponse.json(
				{
					success: false,
					error: "Email content too large (max 1MB)",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Send email
		const result = await sendEmail({
			userId,
			to,
			subject,
			html,
			campaignId,
		});

		return NextResponse.json({
			success: true,
			trackingId: result.trackingId,
			emailId: result.emailId,
			message: "Email sent successfully",
		});
	} catch (error) {
		console.error("Error sending email:", error);

		// Check if it's an SMTP error
		if (error instanceof Error && error.message.includes("SMTP")) {
			return NextResponse.json(
				{
					success: false,
					error: "Failed to send email. Please check SMTP configuration.",
					code: "SMTP_ERROR",
				},
				{ status: 500 },
			);
		}

		return NextResponse.json(
			{
				success: false,
				error: "Failed to send email",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
