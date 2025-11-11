import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listCampaigns } from "@/services/campaign.service";

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

		// Get campaigns
		const campaigns = await listCampaigns(userId);

		return NextResponse.json({
			success: true,
			campaigns,
		});
	} catch (error) {
		console.error("Error listing campaigns:", error);

		return NextResponse.json(
			{
				success: false,
				error: "Failed to list campaigns",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
