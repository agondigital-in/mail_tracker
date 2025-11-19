import { type NextRequest, NextResponse } from "next/server";
import { Campaign } from "@/db/models";
import { auth } from "@/lib/auth";

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

    // Get campaign with execution logs
    const campaign = await Campaign.findOne({ _id: id, userId })
      .populate("mailServers.serverId", "name")
      .lean();

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: "Campaign not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Sort execution logs by date (newest first)
    const executionLogs = ((campaign as any).executionLogs || []).sort(
      (a: any, b: any) =>
        new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime(),
    );

    return NextResponse.json({
      success: true,
      logs: executionLogs,
      campaign: {
        name: (campaign as any).name,
        type: (campaign as any).type,
        schedule: (campaign as any).schedule,
      },
    });
  } catch (error) {
    console.error("Error getting campaign logs:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get campaign logs",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
