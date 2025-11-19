import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { SmtpServer } from "@/db/models";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
        },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const body = await request.json();
    const { smtpServerId, testEmail } = body;

    // Validate input
    if (!smtpServerId) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP Server ID is required",
        },
        { status: 400 },
      );
    }

    if (!testEmail) {
      return NextResponse.json(
        {
          success: false,
          error: "Test email address is required",
        },
        { status: 400 },
      );
    }

    // Get SMTP server from database
    const smtpServer = await SmtpServer.findOne({
      _id: smtpServerId,
      userId,
    });

    if (!smtpServer) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP server not found",
        },
        { status: 404 },
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: smtpServer.host,
      port: smtpServer.port,
      secure: smtpServer.secure,
      auth: {
        user: smtpServer.username,
        pass: smtpServer.password,
      },
    });

    // Verify connection
    await transporter.verify();

    // Send test email to provided address
    await transporter.sendMail({
      from: `${smtpServer.fromName} <${smtpServer.fromEmail}>`,
      to: testEmail,
      subject: "✅ SMTP Server Test - Mail Tracker",
      html: `
				<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
					<h2 style="color: #10b981;">✅ SMTP Server Test Successful!</h2>
					<p>Your SMTP server configuration is working correctly.</p>
					<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
						<p style="margin: 5px 0;"><strong>Server Name:</strong> ${smtpServer.name}</p>
						<p style="margin: 5px 0;"><strong>Host:</strong> ${smtpServer.host}</p>
						<p style="margin: 5px 0;"><strong>Port:</strong> ${smtpServer.port}</p>
						<p style="margin: 5px 0;"><strong>Secure:</strong> ${smtpServer.secure ? "Yes (TLS/SSL)" : "No"}</p>
						<p style="margin: 5px 0;"><strong>From:</strong> ${smtpServer.fromName} &lt;${smtpServer.fromEmail}&gt;</p>
					</div>
					<p style="color: #666; font-size: 14px;">
						This is a test email sent from Mail Tracker to verify your SMTP configuration.
					</p>
					<p style="color: #666; font-size: 12px; margin-top: 20px;">
						Sent at: ${new Date().toLocaleString()}
					</p>
				</div>
			`,
    });

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
    });
  } catch (error) {
    console.error("SMTP test error:", error);

    let errorMessage = "Failed to test SMTP server";
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
