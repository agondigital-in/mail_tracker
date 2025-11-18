import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { resumeCampaign } from "@/services/bulk-campaign.service";

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

		// Resume campaign
		await resumeCampaign(id, userId);

		return NextResponse.json({
			success: true,
			message: "Campaign resumed successfully",
		});
	} catch (error) {
		console.error("Error resuming campaign:", error);

		return NextResponse.json(
			{
				success: false,
				error: error instanceof Error ? error.message : "Failed to resume campaign",
				code: "DATABASE_ERROR",
			},
			{ status: 500 },
		);
	}
}
