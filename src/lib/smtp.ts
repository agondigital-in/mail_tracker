import nodemailer from "nodemailer";
import { SmtpServer } from "@/db/models/smtp-server.model";

/**
 * Get user's SMTP configuration
 */
export async function getUserSmtpConfig(userId: string, smtpServerId?: string) {
	let smtpServer;

	if (smtpServerId) {
		// Use specific SMTP server
		smtpServer = await SmtpServer.findOne({
			_id: smtpServerId,
			userId,
			isActive: true,
		});
	} else {
		// Use default SMTP server
		smtpServer = await SmtpServer.findOne({
			userId,
			isDefault: true,
			isActive: true,
		});

		// If no default, use any active SMTP server
		if (!smtpServer) {
			smtpServer = await SmtpServer.findOne({
				userId,
				isActive: true,
			});
		}
	}

	if (!smtpServer) {
		throw new Error(
			"No SMTP server configured. Please add an SMTP server in settings.",
		);
	}

	return smtpServer;
}

/**
 * Create nodemailer transporter from SMTP config
 */
export function createTransporter(smtpConfig: any) {
	return nodemailer.createTransport({
		host: smtpConfig.host,
		port: smtpConfig.port,
		secure: smtpConfig.secure,
		auth: {
			user: smtpConfig.username,
			pass: smtpConfig.password,
		},
	});
}

/**
 * Get transporter for user
 */
export async function getUserTransporter(userId: string, smtpServerId?: string) {
	const smtpConfig = await getUserSmtpConfig(userId, smtpServerId);
	return {
		transporter: createTransporter(smtpConfig),
		fromEmail: `${smtpConfig.fromName} <${smtpConfig.fromEmail}>`,
	};
}
