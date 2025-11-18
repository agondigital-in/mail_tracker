import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCampaignProgress } from "@/services/bulk-campaign.service";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
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
		const { id } = await params;

		// Get campaign progress
		const progress = await getCampaignProgress(id, userId);

		return NextResponse.json({
			success: true,
			...progress,
		});
	} catch (error) {
		console.error("Error getting campaign progress:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to get campaign progress",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
