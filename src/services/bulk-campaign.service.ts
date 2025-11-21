import { Campaign, RecipientList } from "@/db/models";
import agenda from "@/lib/agenda";
import { getActiveRecipients } from "./recipient.service";

interface CreateBulkCampaignData {
  name: string;
  subject: string;
  htmlContent: string;
  recipientListIds: string[];
  mailServers: Array<{
    serverId: string;
    limit: number;
  }>;
  schedule: {
    type: "immediate" | "scheduled" | "recurring";
    startDate?: Date;
    frequency?: "daily" | "weekly" | "monthly";
    endDate?: Date;
  };
  delay: number;
}

/**
 * Validate campaign data
 */
export function validateCampaignData(data: CreateBulkCampaignData): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Campaign name is required");
  }

  if (!data.subject || data.subject.trim().length === 0) {
    errors.push("Email subject is required");
  }

  if (!data.htmlContent || data.htmlContent.trim().length === 0) {
    errors.push("Email content is required");
  }

  if (!data.recipientListIds || data.recipientListIds.length === 0) {
    errors.push("At least one recipient list is required");
  }

  if (!data.mailServers || data.mailServers.length === 0) {
    errors.push("At least one mail server is required");
  }

  if (data.mailServers) {
    for (const server of data.mailServers) {
      if (!server.serverId) {
        errors.push("Mail server ID is required");
      }
      if (!server.limit || server.limit <= 0) {
        errors.push("Mail server limit must be greater than 0");
      }
    }
  }

  if (data.schedule.type === "scheduled" && !data.schedule.startDate) {
    errors.push("Start date is required for scheduled campaigns");
  }

  if (data.schedule.type === "recurring") {
    if (!data.schedule.frequency) {
      errors.push("Frequency is required for recurring campaigns");
    }
  }

  if (data.delay < 0) {
    errors.push("Delay cannot be negative");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Calculate estimated duration for campaign
 */
export function calculateEstimatedDuration(
  recipientCount: number,
  delay: number,
): number {
  // Duration in seconds
  return recipientCount * delay;
}

/**
 * Create bulk email campaign
 */
export async function createBulkCampaign(
  userId: string,
  data: CreateBulkCampaignData,
) {
  // Validate data
  const validation = validateCampaignData(data);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.errors.join(", ")}`);
  }

  // Verify recipient lists ownership
  for (const listId of data.recipientListIds) {
    const list = await RecipientList.findOne({ _id: listId, userId });
    if (!list) {
      throw new Error(`Recipient list ${listId} not found or unauthorized`);
    }
  }

  // Get total recipient count
  const recipients = await getActiveRecipients(data.recipientListIds);
  const totalRecipients = recipients.length;

  if (totalRecipients === 0) {
    throw new Error("No active recipients found in selected lists");
  }

  // Calculate estimated duration
  const estimatedDuration = calculateEstimatedDuration(
    totalRecipients,
    data.delay,
  );

  // Create campaign
  const campaign = await Campaign.create({
    userId,
    type: "bulk",
    name: data.name,
    subject: data.subject,
    htmlContent: data.htmlContent,
    recipientListIds: data.recipientListIds,
    mailServers: data.mailServers.map((server) => ({
      serverId: server.serverId,
      limit: server.limit,
      sent: 0,
    })),
    schedule: data.schedule,
    delay: data.delay,
    status: data.schedule.type === "immediate" ? "processing" : "scheduled",
    totalRecipients,
    sentCount: 0,
    failedCount: 0,
    remainingCount: totalRecipients,
    failedRecipients: [],
  });

  // Schedule Agenda job
  const jobName =
    data.schedule.type === "recurring"
      ? "process-recurring-campaign"
      : "process-bulk-campaign";

  let job: Awaited<ReturnType<typeof agenda.now>> | undefined;
  if (data.schedule.type === "immediate") {
    job = await agenda.now(jobName, { campaignId: campaign._id.toString() });
  } else if (data.schedule.type === "scheduled" && data.schedule.startDate) {
    job = await agenda.schedule(data.schedule.startDate, jobName, {
      campaignId: campaign._id.toString(),
    });
  } else if (data.schedule.type === "recurring") {
    // For recurring, schedule first execution
    const startDate = data.schedule.startDate || new Date();
    job = await agenda.schedule(startDate, jobName, {
      campaignId: campaign._id.toString(),
    });
  }

  // Update campaign with job ID
  if (job) {
    campaign.agendaJobId = job.attrs._id?.toString();
    await campaign.save();
  }

  return {
    campaign,
    estimatedDuration,
  };
}

/**
 * Pause a campaign
 */
export async function pauseCampaign(campaignId: string, userId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });

  if (!campaign) {
    throw new Error("Campaign not found or unauthorized");
  }

  if (campaign.status !== "processing") {
    throw new Error("Only processing campaigns can be paused");
  }

  // Update campaign status
  campaign.status = "paused";
  await campaign.save();

  // Cancel Agenda job
  if (campaign.agendaJobId) {
    await agenda.cancel({ _id: campaign.agendaJobId });
  }

  return { success: true };
}

/**
 * Resume a paused or cancelled campaign
 */
export async function resumeCampaign(campaignId: string, userId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });

  if (!campaign) {
    throw new Error("Campaign not found or unauthorized");
  }

  if (campaign.status !== "paused" && campaign.status !== "cancelled") {
    throw new Error("Only paused or cancelled campaigns can be resumed");
  }

  // Determine new status based on schedule
  let newStatus = "processing";
  if (
    campaign.schedule?.type === "scheduled" ||
    campaign.schedule?.type === "recurring"
  ) {
    // Check if scheduled time is in future
    if (campaign.schedule.startDate) {
      const startDate = new Date(campaign.schedule.startDate);
      if (startDate > new Date()) {
        newStatus = "scheduled";
      }
    }
  }

  // Update campaign status
  campaign.status = newStatus;
  await campaign.save();

  // Reschedule Agenda job
  const jobName =
    campaign.schedule?.type === "recurring"
      ? "process-recurring-campaign"
      : "process-bulk-campaign";

  let job;

  if (newStatus === "scheduled" && campaign.schedule?.startDate) {
    const startDate = new Date(campaign.schedule.startDate);
    const now = new Date();

    if (startDate > now) {
      // Schedule for future
      job = await agenda.schedule(startDate, jobName, {
        campaignId: campaign._id.toString(),
      });
    } else {
      // Start immediately if overdue
      job = await agenda.now(jobName, {
        campaignId: campaign._id.toString(),
      });
    }
  } else {
    // Start immediately for processing status
    job = await agenda.now(jobName, {
      campaignId: campaign._id.toString(),
    });
  }

  if (job) {
    campaign.agendaJobId = job.attrs._id?.toString();
    await campaign.save();
  }

  return { success: true };
}

/**
 * Cancel a campaign
 */
export async function cancelCampaign(campaignId: string, userId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });

  if (!campaign) {
    throw new Error("Campaign not found or unauthorized");
  }

  if (
    campaign.status !== "processing" &&
    campaign.status !== "paused" &&
    campaign.status !== "scheduled"
  ) {
    throw new Error("Cannot cancel completed or failed campaigns");
  }

  // Update campaign status
  campaign.status = "cancelled";
  campaign.completedAt = new Date();
  await campaign.save();

  // Cancel Agenda job
  if (campaign.agendaJobId) {
    await agenda.cancel({ _id: campaign.agendaJobId });
  }

  return { success: true };
}

/**
 * Get campaign progress
 */
export async function getCampaignProgress(campaignId: string, userId: string) {
  const campaign = await Campaign.findOne({ _id: campaignId, userId });

  if (!campaign) {
    throw new Error("Campaign not found or unauthorized");
  }

  // Calculate sending rate (emails per minute)
  let rate = 0;
  if (campaign.sentAt && campaign.sentCount > 0) {
    const elapsedMinutes = (Date.now() - campaign.sentAt.getTime()) / 1000 / 60;
    rate = elapsedMinutes > 0 ? campaign.sentCount / elapsedMinutes : 0;
  }

  return {
    status: campaign.status,
    totalRecipients: campaign.totalRecipients,
    sentCount: campaign.sentCount,
    failedCount: campaign.failedCount,
    remainingCount: campaign.remainingCount,
    rate: Math.round(rate * 100) / 100,
    failedRecipients: campaign.failedRecipients || [],
    campaign: {
      name: campaign.name,
      schedule: campaign.schedule,
    },
  };
}
