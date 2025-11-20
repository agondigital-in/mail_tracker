import { type NextRequest, NextResponse } from "next/server";
import { Campaign, Email } from "@/db/models";
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

export async function PUT(
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

    // Check if campaign can be edited
    if (campaign.status === "processing") {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot edit campaign while processing",
          code: "INVALID_STATUS",
        },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { name, description, subject, htmlContent, delay, mailServers } =
      body;

    // Validate input
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign name is required",
          code: "VALIDATION_ERROR",
        },
        { status: 400 },
      );
    }

    // Build update object
    const updateData: {
      name: string;
      description: string;
      subject?: string;
      htmlContent?: string;
      delay?: number;
      mailServers?: Array<{
        serverId: string;
        limit: number;
        sent: number;
      }>;
    } = {
      name: name.trim(),
      description: description?.trim() || "",
    };

    // Add bulk campaign fields if provided
    if (campaign.type === "bulk") {
      if (subject !== undefined) {
        if (!subject.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "Email subject is required for bulk campaigns",
              code: "VALIDATION_ERROR",
            },
            { status: 400 },
          );
        }
        updateData.subject = subject.trim();
      }

      if (htmlContent !== undefined) {
        if (!htmlContent.trim()) {
          return NextResponse.json(
            {
              success: false,
              error: "Email content is required for bulk campaigns",
              code: "VALIDATION_ERROR",
            },
            { status: 400 },
          );
        }
        updateData.htmlContent = htmlContent.trim();
      }

      if (delay !== undefined) {
        updateData.delay = Math.max(0, Number(delay));
      }

      // Handle SMTP servers update
      if (mailServers !== undefined) {
        if (!Array.isArray(mailServers) || mailServers.length === 0) {
          return NextResponse.json(
            {
              success: false,
              error: "At least one SMTP server is required",
              code: "VALIDATION_ERROR",
            },
            { status: 400 },
          );
        }

        // Validate each server config
        for (const server of mailServers) {
          if (!server.serverId || !server.serverId.trim()) {
            return NextResponse.json(
              {
                success: false,
                error: "SMTP server ID is required",
                code: "VALIDATION_ERROR",
              },
              { status: 400 },
            );
          }

          if (!server.limit || server.limit < 1) {
            return NextResponse.json(
              {
                success: false,
                error: "SMTP server limit must be at least 1",
                code: "VALIDATION_ERROR",
              },
              { status: 400 },
            );
          }
        }

        // Preserve 'sent' count from existing servers
        const existingServers = campaign.mailServers || [];
        updateData.mailServers = mailServers.map((newServer: { serverId: string; limit: number; sent?: number }) => {
          const existing = existingServers.find(
            (s: { serverId: { toString: () => string } }) =>
              s.serverId.toString() === newServer.serverId,
          );
          return {
            serverId: newServer.serverId,
            limit: newServer.limit,
            sent: existing?.sent || newServer.sent || 0,
          };
        });
      }
    }

    // Update campaign
    const updatedCampaign = await Campaign.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign,
    });
  } catch (error) {
    console.error("Error updating campaign:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update campaign",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
