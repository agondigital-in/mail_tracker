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
    const {
      smtpServerId,
      name,
      host,
      port,
      secure,
      username,
      password,
      fromEmail,
      fromName,
      isDefault,
    } = body;

    // Validate required fields
    if (
      !smtpServerId ||
      !name ||
      !host ||
      !port ||
      !username ||
      !password ||
      !fromEmail ||
      !fromName
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 },
      );
    }

    // Check if SMTP server belongs to user
    const existingServer = await SmtpServer.findOne({
      _id: smtpServerId,
      userId: session.user.id,
    });

    if (!existingServer) {
      return NextResponse.json(
        { error: "SMTP server not found" },
        { status: 404 },
      );
    }

    // If this is set as default, unset other defaults for this user
    if (isDefault) {
      await SmtpServer.updateMany(
        { userId: session.user.id, _id: { $ne: smtpServerId } },
        { isDefault: false },
      );
    }

    // Prepare update data
    const updateData: any = {
      name,
      host,
      port,
      secure: secure || false,
      username,
      fromEmail,
      fromName,
      isDefault: isDefault || false,
    };

    // Only update password if provided
    if (password && password.trim() !== "") {
      updateData.password = password;
    }

    // Update SMTP server
    await SmtpServer.findByIdAndUpdate(smtpServerId, updateData);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating SMTP server:", error);
    return NextResponse.json(
      { error: "Failed to update SMTP server" },
      { status: 500 },
    );
  }
}
