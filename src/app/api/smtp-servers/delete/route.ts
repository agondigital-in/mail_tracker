import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { SmtpServer } from "@/db/models/smtp-server.model";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { smtpServerId } = body;

    if (!smtpServerId) {
      return NextResponse.json(
        { error: "SMTP Server ID is required" },
        { status: 400 },
      );
    }

    const smtpServer = await SmtpServer.findOne({
      _id: smtpServerId,
      userId: session.user.id,
    });

    if (!smtpServer) {
      return NextResponse.json(
        { error: "SMTP Server not found" },
        { status: 404 },
      );
    }

    await SmtpServer.findByIdAndUpdate(smtpServerId, { isActive: false });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting SMTP server:", error);
    return NextResponse.json(
      { error: "Failed to delete SMTP server" },
      { status: 500 },
    );
  }
}
