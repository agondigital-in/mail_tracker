import { type NextRequest, NextResponse } from "next/server";
import { Email } from "@/db/models";
import { auth } from "@/lib/auth";
import { getCampaignById, getCampaignStats } from "@/services/campaign.service";

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

    // Get campaign with authorization check
    const campaign = await getCampaignById(id, userId);

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: "Campaign not found", code: "NOT_FOUND" },
        { status: 404 },
      );
    }

    // Get campaign statistics
    const stats = await getCampaignStats(id);

    // Get all emails in the campaign
    const emails = await Email.find({ campaignId: id })
      .sort({ sentAt: -1 })
      .populate("smtpServerId", "name host");

    return NextResponse.json({
      success: true,
      campaign,
      stats,
      emails,
    });
  } catch (error) {
    console.error("Error getting campaign details:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get campaign details",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
