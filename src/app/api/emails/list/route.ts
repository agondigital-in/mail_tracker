import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listEmails } from "@/services/email.service";

export async function GET(request: NextRequest) {
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

		// Get query parameters
		const { searchParams } = new URL(request.url);
		const page = Number.parseInt(searchParams.get("page") || "1", 10);
		const limit = Number.parseInt(searchParams.get("limit") || "20", 10);
		const campaignId = searchParams.get("campaignId") || undefined;

		// Validate pagination parameters
		if (page < 1 || limit < 1 || limit > 100) {
			return NextResponse.json(
				{
					success: false,
					error: "Invalid pagination parameters",
					code: "INVALID_INPUT",
				},
				{ status: 400 },
			);
		}

		// Get emails
		const result = await listEmails(userId, { page, limit, campaignId });

		return NextResponse.json({
			success: true,
			emails: result.emails,
			total: result.total,
			page: result.page,
			totalPages: result.totalPages,
		});
	} catch (error) {
		console.error("Error listing emails:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to list emails",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
