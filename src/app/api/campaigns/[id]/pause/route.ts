import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { pauseCampaign } from "@/services/bulk-campaign.service";

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

    // Pause campaign
    await pauseCampaign(id, userId);

    return NextResponse.json({
      success: true,
      message: "Campaign paused successfully",
    });
  } catch (error) {
    console.error("Error pausing campaign:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to pause campaign",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
