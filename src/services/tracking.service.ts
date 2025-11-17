import { ClickEvent, Email, OpenEvent } from "@/db/models";

interface EventMetadata {
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

/**
 * Detect if user agent is Gmail's image proxy
 */
export function isGmailProxy(userAgent: string): boolean {
  return userAgent.includes("GoogleImageProxy");
}

/**
 * Detect if open is from a bot/automated service
 */
export function isBotOrAutomated(userAgent: string): boolean {
  const botPatterns = [
    "GoogleImageProxy",
    "node",
    "bot",
    "crawler",
    "spider",
    "preview",
    "scanner",
    "Yahoo! Slurp",
    "Baiduspider",
  ];

  const userAgentLower = userAgent.toLowerCase();
  return botPatterns.some((pattern) =>
    userAgentLower.includes(pattern.toLowerCase()),
  );
}

/**
 * Log open event and update email record
 */
export async function logOpenEvent(
  trackingId: string,
  metadata: EventMetadata,
) {
  try {
    // Find the email by tracking ID
    const email = await Email.findOne({ trackingId });

    if (!email) {
      console.error(`Email not found for tracking ID: ${trackingId}`);
      return;
    }

    // Check if this is the first open event
    const existingOpens = await OpenEvent.countDocuments({
      emailId: email._id,
    });
    const isUnique = existingOpens === 0;

    // Detect Gmail proxy and bots
    const gmailProxy = isGmailProxy(metadata.userAgent);
    const isBot = isBotOrAutomated(metadata.userAgent);

    // Create open event
    await OpenEvent.create({
      emailId: email._id,
      trackingId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      isGmailProxy: gmailProxy,
      isUnique,
      timestamp: metadata.timestamp,
    });

    // Log bot detection for debugging
    if (isBot) {
      console.log(
        `Bot/Automated open detected - User Agent: ${metadata.userAgent}`,
      );
    }

    // Update email record
    const updateData: Record<string, unknown> = {
      totalOpens: email.totalOpens + 1,
    };

    if (isUnique) {
      updateData.uniqueOpens = email.uniqueOpens + 1;
      updateData.firstOpenAt = metadata.timestamp;
    }

    await Email.updateOne({ _id: email._id }, { $set: updateData });
  } catch (error) {
    console.error("Error logging open event:", error);
  }
}

/**
 * Log click event and update email record
 */
export async function logClickEvent(
  trackingId: string,
  destinationUrl: string,
  metadata: EventMetadata,
) {
  try {
    // Find the email by tracking ID
    const email = await Email.findOne({ trackingId });

    if (!email) {
      console.error(`Email not found for tracking ID: ${trackingId}`);
      return;
    }

    // Check if this is the first click event
    const existingClicks = await ClickEvent.countDocuments({
      emailId: email._id,
    });
    const isUnique = existingClicks === 0;

    // Create click event
    await ClickEvent.create({
      emailId: email._id,
      trackingId,
      destinationUrl,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      isUnique,
      timestamp: metadata.timestamp,
    });

    // Update email record
    const updateData: Record<string, unknown> = {
      totalClicks: email.totalClicks + 1,
    };

    if (isUnique) {
      updateData.uniqueClicks = email.uniqueClicks + 1;
      updateData.firstClickAt = metadata.timestamp;
    }

    await Email.updateOne({ _id: email._id }, { $set: updateData });

    // Create implicit open event if no opens exist
    if (!email.firstOpenAt) {
      await logOpenEvent(trackingId, metadata);
    }
  } catch (error) {
    console.error("Error logging click event:", error);
  }
}

/**
 * Update email first open timestamp
 */
export async function updateEmailFirstOpen(
  trackingId: string,
  timestamp: Date,
) {
  try {
    await Email.updateOne(
      { trackingId, firstOpenAt: { $exists: false } },
      { $set: { firstOpenAt: timestamp } },
    );
  } catch (error) {
    console.error("Error updating first open:", error);
  }
}

/**
 * Update email first click timestamp
 */
export async function updateEmailFirstClick(
  trackingId: string,
  timestamp: Date,
) {
  try {
    await Email.updateOne(
      { trackingId, firstClickAt: { $exists: false } },
      { $set: { firstClickAt: timestamp } },
    );
  } catch (error) {
    console.error("Error updating first click:", error);
  }
}
