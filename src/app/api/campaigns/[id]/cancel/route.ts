import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { cancelCampaign } from "@/services/bulk-campaign.service";

export async function POST(
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

		// Cancel campaign
		await cancelCampaign(id, userId);

		return NextResponse.json({
			success: true,
			message: "Campaign cancelled successfully",
		});
	} catch (error) {
		console.error("Error cancelling campaign:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to cancel campaign",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
