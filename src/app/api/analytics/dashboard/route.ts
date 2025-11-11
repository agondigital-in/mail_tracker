import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getDashboardStats } from "@/services/analytics.service";

export async function GET(request: NextRequest) {
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

    // Get dashboard statistics
    const stats = await getDashboardStats(userId);

    return NextResponse.json({
      success: true,
      ...stats,
    });
  } catch (error) {
    console.error("Error getting dashboard analytics:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get dashboard analytics",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
