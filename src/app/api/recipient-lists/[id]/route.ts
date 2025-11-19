import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getListRecipients } from "@/services/recipient.service";
import {
  deleteList,
  getListById,
  getListStats,
} from "@/services/recipient-list.service";

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

    // Get list
    const list = await getListById(id, userId);

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: "Recipient list not found",
          code: "NOT_FOUND",
        },
        { status: 404 },
      );
    }

    // Get recipients
    const recipients = await getListRecipients(id);

    // Get stats
    const stats = await getListStats(id);

    return NextResponse.json({
      success: true,
      list,
      recipients,
      stats,
    });
  } catch (error) {
    console.error("Error getting recipient list:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get recipient list",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    // Delete list
    await deleteList(id, userId);

    return NextResponse.json({
      success: true,
      message: "Recipient list deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recipient list:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to delete recipient list",
        code: "DATABASE_ERROR",
      },
      { status: 500 },
    );
  }
}
