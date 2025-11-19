import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createBulkCampaign } from "@/services/bulk-campaign.service";

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
    const {
      name,
      subject,
      htmlContent,
      recipientListIds,
      mailServers,
      schedule,
      delay,
    } = body;

    // Create bulk campaign
    const result = await createBulkCampaign(userId, {
      name,
      subject,
      htmlContent,
      recipientListIds,
      mailServers,
      schedule,
      delay: delay || 0,
    });

    return NextResponse.json({
      success: true,
      campaignId: result.campaign._id.toString(),
      campaign: result.campaign,
      estimatedDuration: result.estimatedDuration,
      message: "Bulk campaign created successfully",
    });
  } catch (error) {
    console.error("Error creating bulk campaign:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to create bulk campaign",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
