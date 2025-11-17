import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SmtpServer } from "@/db/models/smtp-server.model";

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const smtpServers = await SmtpServer.find({
			userId: session.user.id,
			isActive: true,
		}).select("-password").sort({ isDefault: -1, createdAt: -1 });

		return NextResponse.json({
			success: true,
			smtpServers,
		});
	} catch (error) {
		console.error("Error fetching SMTP servers:", error);
		return NextResponse.json(
			{ error: "Failed to fetch SMTP servers" },
			{ status: 500 },
		);
	}
}
