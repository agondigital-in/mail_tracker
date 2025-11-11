import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createCampaign } from "@/services/campaign.service";

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
    const { name, description } = body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign name is required",
          code: "INVALID_INPUT",
        },
        { status: 400 },
      );
    }

    // Create campaign
    const campaign = await createCampaign(userId, { name, description });

    return NextResponse.json({
      success: true,
      campaignId: campaign._id.toString(),
      campaign,
      message: "Campaign created successfully",
    });
  } catch (error) {
    console.error("Error creating campaign:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create campaign",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
