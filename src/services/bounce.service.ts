import { Email, BounceEvent } from "@/db/models";

interface BounceData {
	trackingId: string;
	recipientEmail: string;
	reason: string;
	type?: "hard" | "soft";
	timestamp: Date;
}

/**
 * Categorize bounce as hard or soft based on reason
 */
export function categorizeBounce(reason: string): "hard" | "soft" {
	const hardBounceKeywords = [
		"does not exist",
		"user unknown",
		"invalid",
		"not found",
		"permanent",
		"disabled",
		"rejected",
		"no such user",
		"mailbox unavailable",
		"address rejected",
	];

	const reasonLower = reason.toLowerCase();

	for (const keyword of hardBounceKeywords) {
		if (reasonLower.includes(keyword)) {
			return "hard";
		}
	}

	return "soft";
}

/**
 * Log bounce event and update email record
 */
export async function logBounceEvent(data: BounceData) {
	try {
		const { trackingId, recipientEmail, reason, timestamp } = data;

		// Find the email by tracking ID
		const email = await Email.findOne({ trackingId });

		if (!email) {
			console.error(`Email not found for tracking ID: ${trackingId}`);
			return;
		}

		// Check if bounce already exists
		const existingBounce = await BounceEvent.findOne({ emailId: email._id });

		if (existingBounce) {
			console.log(`Bounce already logged for email: ${email._id}`);
			return;
		}

		// Categorize bounce type
		const bounceType = data.type || categorizeBounce(reason);

		// Create bounce event
		await BounceEvent.create({
			emailId: email._id,
			trackingId,
			recipientEmail,
			bounceType,
			reason,
			timestamp,
		});

		// Update email record
		await Email.updateOne(
			{ _id: email._id },
			{
				$set: {
					bounced: true,
					bounceReason: reason,
					bounceType,
				},
			},
		);

		// Flag email address if hard bounce
		if (bounceType === "hard") {
			await flagEmailAddress(recipientEmail);
		}
	} catch (error) {
		console.error("Error logging bounce event:", error);
	}
}

/**
 * Flag email address for review (hard bounce)
 */
export async function flagEmailAddress(email: string) {
	try {
		// In a production system, you might:
		// 1. Add to a blocklist collection
		// 2. Mark in a separate "flagged_emails" collection
		// 3. Send notification to admin
		// For now, we'll just log it
		console.warn(`Email address flagged for review: ${email}`);

		// You could implement a FlaggedEmail model and store it:
		// await FlaggedEmail.create({
		//   email,
		//   reason: 'hard_bounce',
		//   flaggedAt: new Date()
		// });
	} catch (error) {
		console.error("Error flagging email address:", error);
	}
}
