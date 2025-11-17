import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SmtpServer } from "@/db/models/smtp-server.model";

export async function POST(req: NextRequest) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await req.json();
		const { name, host, port, secure, username, password, fromEmail, fromName, isDefault } = body;

		// Validate required fields
		if (!name || !host || !port || !username || !password || !fromEmail || !fromName) {
			return NextResponse.json(
				{ error: "All fields are required" },
				{ status: 400 },
			);
		}

		// If this is set as default, unset other defaults for this user
		if (isDefault) {
			await SmtpServer.updateMany(
				{ userId: session.user.id },
				{ isDefault: false },
			);
		}

		const smtpServer = await SmtpServer.create({
			userId: session.user.id,
			name,
			host,
			port,
			secure: secure || false,
			username,
			password,
			fromEmail,
			fromName,
			isDefault: isDefault || false,
		});

		return NextResponse.json({
			success: true,
			smtpServerId: smtpServer._id,
		});
	} catch (error) {
		console.error("Error creating SMTP server:", error);
		return NextResponse.json(
			{ error: "Failed to create SMTP server" },
			{ status: 500 },
		);
	}
}
