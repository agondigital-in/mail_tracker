import type { Job } from "agenda";
import { Campaign, Email, Recipient } from "@/db/models";
import agenda from "@/lib/agenda";
import { sendEmail } from "./email.service";
import { sendExecutionReport } from "./reports/execution-report.service";
import { processVariables } from "./template.service";

interface CampaignJobData {
  campaignId: string;
}

/**
 * Get active recipients from campaign's recipient lists (optimized)
 * Sorted based on campaign's sortOrder preference
 * Filters out recipients who have already been sent emails from this campaign
 */
async function getActiveRecipients(
  campaign: {
    _id: unknown;
    recipientListIds: string[];
    schedule?: {
      sortOrder?: "newest" | "oldest";
    };
  },
  excludeCampaignId?: string,
  limit?: number,
) {
  // Determine sort order (default: newest first)
  const sortOrder = campaign.schedule?.sortOrder === "oldest" ? 1 : -1;

  // Build query - exclude recipients who already received email from this campaign
  const query: {
    recipientListId: { $in: string[] };
    unsubscribed: boolean;
    sentCampaigns?: { $nin: unknown[] };
  } = {
    recipientListId: { $in: campaign.recipientListIds },
    unsubscribed: false,
  };

  // For recurring campaigns, exclude recipients who already got email from this campaign
  if (excludeCampaignId) {
    query.sentCampaigns = { $nin: [excludeCampaignId] };
  }

  // Build query with optional limit
  let queryBuilder = Recipient.find(query).sort({ createdAt: sortOrder });

  // Apply limit if provided (for batch processing)
  if (limit && limit > 0) {
    queryBuilder = queryBuilder.limit(limit);
  }

  // Use lean() for better performance
  const recipients = await queryBuilder.lean();

  return recipients;
}

/**
 * Check if campaign is paused
 */
async function checkPauseStatus(campaignId: string): Promise<boolean> {
  const campaign = await Campaign.findById(campaignId);
  return campaign?.status === "paused";
}

/**
 * Handle send error
 */
async function handleSendError(
  campaignId: string,
  recipientEmail: string,
  error: string,
) {
  await Campaign.findByIdAndUpdate(campaignId, {
    $push: {
      failedRecipients: {
        email: recipientEmail,
        error,
        timestamp: new Date(),
      },
    },
    $inc: {
      failedCount: 1,
      remainingCount: -1,
    },
  });
}

/**
 * Process template variables for a recipient
 */
function processTemplate(
  html: string,
  recipient: {
    email: string;
    name?: string;
    customFields?: Map<string, unknown> | Record<string, unknown>;
  },
): string {
  const recipientData: Record<string, string | number | boolean> = {
    email: recipient.email,
    name: recipient.name || "",
  };

  // Add custom fields
  if (recipient.customFields) {
    // Handle both Map and plain object
    if (recipient.customFields instanceof Map) {
      for (const [key, value] of recipient.customFields.entries()) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          recipientData[key] = value;
        }
      }
    } else if (typeof recipient.customFields === "object") {
      // Handle plain object from MongoDB
      for (const [key, value] of Object.entries(recipient.customFields)) {
        if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          recipientData[key] = value;
        }
      }
    }
  }

  return processVariables(html, recipientData);
}

/**
 * Main campaign job processor (optimized)
 */
export async function processCampaign(job: Job<CampaignJobData>) {
  const { campaignId } = job.attrs.data;
  const executionStartTime = Date.now();

  try {
    // Load campaign
    const campaign = await Campaign.findById(campaignId).populate(
      "mailServers.serverId",
    );
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Get active recipients (single optimized query)
    // For bulk campaigns, we don't exclude by campaign ID (one-time send)
    const activeRecipients = await getActiveRecipients(campaign);

    if (activeRecipients.length === 0) {
      await Campaign.findByIdAndUpdate(campaignId, {
        status: "completed",
        completedAt: new Date(),
      });
      return;
    }

    // Update status and counts in single query
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "processing",
      sentAt: new Date(),
      totalRecipients: activeRecipients.length,
      remainingCount: activeRecipients.length,
    });

    // Distribute recipients to mail servers
    const { recipientsByServer } = distributeToServers(
      activeRecipients,
      campaign.mailServers,
    );

    // Send emails with delay (optimized with batch updates)
    for (const [serverIndex, recipients] of recipientsByServer.entries()) {
      const serverConfig = campaign.mailServers[serverIndex];
      let batchSuccessCount = 0;

      for (const recipient of recipients as Array<{
        email: string;
        name?: string;
        customFields?: Map<string, unknown>;
      }>) {
        // Check if paused every 10 emails (reduce DB calls)
        if (batchSuccessCount % 10 === 0) {
          const isPaused = await checkPauseStatus(campaignId);
          if (isPaused) {
            return; // Exit job, will be resumed later
          }
        }

        try {
          // Process template
          const processedHtml = processTemplate(
            campaign.htmlContent,
            recipient,
          );
          const processedSubject = processTemplate(campaign.subject, recipient);

          // Send email (automatically creates Email record with tracking)
          // Extract serverId - handle both populated object and string
          const smtpServerId =
            typeof serverConfig.serverId === "object" &&
            serverConfig.serverId !== null &&
            "_id" in serverConfig.serverId
              ? String((serverConfig.serverId as { _id: unknown })._id)
              : String(serverConfig.serverId);

          await sendEmail({
            userId: campaign.userId,
            to: recipient.email,
            subject: processedSubject,
            html: processedHtml,
            campaignId: campaign._id.toString(),
            recipientId: (recipient as { _id?: unknown })._id?.toString(),
            smtpServerId,
          });

          batchSuccessCount++;

          // Batch update every 10 successful sends
          if (batchSuccessCount % 10 === 0) {
            await Campaign.findByIdAndUpdate(campaignId, {
              $inc: {
                sentCount: 10,
                remainingCount: -10,
                [`mailServers.${serverIndex}.sent`]: 10,
              },
            });
          }

          // Apply delay
          if (campaign.delay > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, campaign.delay * 1000),
            );
          }
        } catch (error) {
          // Track failed email in Email collection
          const recipientWithId = recipient as { _id?: unknown };
          if (recipientWithId._id) {
            // Extract serverId - handle both populated object and string
            const smtpServerId =
              typeof serverConfig.serverId === "object" &&
              serverConfig.serverId !== null &&
              "_id" in serverConfig.serverId
                ? String((serverConfig.serverId as { _id: unknown })._id)
                : String(serverConfig.serverId);

            await Email.create({
              userId: campaign.userId,
              campaignId: campaign._id,
              recipientId: recipientWithId._id,
              trackingId: `failed-${Date.now()}-${Math.random()}`,
              to: recipient.email,
              from: campaign.from || "",
              subject: campaign.subject,
              htmlContent: campaign.htmlContent,
              status: "failed",
              error: error instanceof Error ? error.message : "Unknown error",
              smtpServerId,
              sentAt: new Date(),
              bounced: false,
              uniqueOpens: 0,
              uniqueClicks: 0,
              totalOpens: 0,
              totalClicks: 0,
            }).catch(() => {
              // Ignore duplicate key errors
            });
          }

          // Handle send error
          await handleSendError(
            campaignId,
            recipient.email,
            error instanceof Error ? error.message : "Unknown error",
          );
        }
      }

      // Update remaining count for this server
      const remainder = batchSuccessCount % 10;
      if (remainder > 0) {
        await Campaign.findByIdAndUpdate(campaignId, {
          $inc: {
            sentCount: remainder,
            remainingCount: -remainder,
            [`mailServers.${serverIndex}.sent`]: remainder,
          },
        });
      }
    }

    // Calculate execution duration
    const executionDuration = Math.floor(
      (Date.now() - executionStartTime) / 1000,
    );

    // Get SMTP stats
    const smtpStats = await Promise.all(
      campaign.mailServers.map(async (server: any, index: number) => {
        const serverData = server.serverId;
        // Extract serverId - handle both populated object and string
        const serverId =
          typeof server.serverId === "object" &&
          server.serverId !== null &&
          "_id" in server.serverId
            ? String((server.serverId as { _id: unknown })._id)
            : String(server.serverId);

        return {
          serverId,
          serverName: serverData?.name || "Unknown",
          sent: recipientsByServer.get(index)?.length || 0,
          failed: 0, // Will be updated if we track per-server failures
        };
      }),
    );

    // Get final counts
    const finalCampaign = await Campaign.findById(campaignId);
    const totalSent = finalCampaign?.sentCount || 0;
    const totalFailed = finalCampaign?.failedCount || 0;

    // Add execution log
    await Campaign.findByIdAndUpdate(campaignId, {
      status: "completed",
      completedAt: new Date(),
      $push: {
        executionLogs: {
          executedAt: new Date(),
          status: totalFailed > 0 ? "partial" : "success",
          sentCount: totalSent,
          failedCount: totalFailed,
          duration: executionDuration,
          smtpStats,
        },
      },
    });

    // Send execution report email
    console.log("Execution Report init");
    await sendExecutionReport({
      campaign: finalCampaign,
      executionStartTime: new Date(executionStartTime),
      executionEndTime: new Date(),
      executionDuration,
      totalSent,
      totalFailed,
      smtpStats,
      remainingCount: finalCampaign?.remainingCount || 0,
    });
    console.log("Execution Report has been sended");
  } catch (error) {
    // Calculate execution duration
    const executionDuration = Math.floor(
      (Date.now() - executionStartTime) / 1000,
    );

    console.log("=".repeat(60));
    console.log("❌ JOB FAILED");
    console.log(
      `🚨 Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    console.log(`⏱️  Duration: ${executionDuration}s`);
    console.log(`⏰ Failed at: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    // Mark campaign as failed and log execution
    await Campaign.findByIdAndUpdate(campaignId, {
      $set: {
        status: "failed",
        completedAt: new Date(),
      },
      $push: {
        executionLogs: {
          executedAt: new Date(),
          status: "failed",
          sentCount: 0,
          failedCount: 0,
          duration: executionDuration,
          smtpStats: [],
          error: error instanceof Error ? error.message : "Unknown error",
        },
      },
    });

    throw error;
  }
}

/**
 * Distribute recipients to mail servers based on limits
 */
export function distributeToServers(
  recipients: unknown[],
  mailServers: Array<{ serverId: unknown; limit: number; sent: number }>,
): {
  recipientsByServer: Map<number, unknown[]>;
} {
  const recipientsByServer = new Map<number, unknown[]>();

  // Initialize arrays for each server
  for (let i = 0; i < mailServers.length; i++) {
    recipientsByServer.set(i, []);
  }

  let currentServerIndex = 0;

  for (const recipient of recipients) {
    // Find next available server
    let assigned = false;

    for (let i = 0; i < mailServers.length; i++) {
      const serverIndex = (currentServerIndex + i) % mailServers.length;
      const server = mailServers[serverIndex];
      const currentRecipients = recipientsByServer.get(serverIndex) || [];

      // Check if server has capacity
      if (currentRecipients.length < server.limit) {
        currentRecipients.push(recipient);
        recipientsByServer.set(serverIndex, currentRecipients);
        currentServerIndex = (serverIndex + 1) % mailServers.length;
        assigned = true;
        break;
      }
    }

    // If no server has capacity, stop
    if (!assigned) {
      break;
    }
  }

  return { recipientsByServer };
}

/**
 * Send batch of emails with delay and track in SentEmail collection
 */
export async function sendBatch(
  recipients: Array<{
    _id?: unknown;
    email: string;
    name?: string;
    customFields?: Map<string, unknown>;
  }>,
  serverConfig: { serverId: string; limit: number },
  campaignId: string,
  userId: string,
  from: string,
  subject: string,
  htmlContent: string,
  delay: number,
) {
  for (const recipient of recipients) {
    try {
      // Process template
      const processedHtml = processTemplate(htmlContent, recipient);
      const processedSubject = processTemplate(subject, recipient);

      // Send email (automatically creates Email record)
      await sendEmail({
        userId,
        to: recipient.email,
        subject: processedSubject,
        html: processedHtml,
        campaignId,
        recipientId: recipient._id?.toString(),
        smtpServerId: serverConfig.serverId,
      });

      // Mark this campaign as sent in recipient's sentCampaigns array (SUCCESS)
      if (recipient._id) {
        await Recipient.findByIdAndUpdate(recipient._id, {
          $addToSet: { sentCampaigns: campaignId },
        });
      }

      // Apply delay
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay * 1000));
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Skip if duplicate key error (already processed)
      if (
        errorMessage.includes("E11000") ||
        errorMessage.includes("duplicate key")
      ) {
        console.log(
          `[SendBatch] Skipping duplicate: ${recipient.email} - already in database`,
        );
        continue;
      }

      console.log(
        `[SendBatch] Failed to send to ${recipient.email}: ${errorMessage}`,
      );

      // Track failed email in Email collection
      if (recipient._id) {
        await Email.create({
          userId,
          campaignId,
          recipientId: recipient._id,
          trackingId: `failed-${Date.now()}-${Math.random()}`,
          to: recipient.email,
          from: from,
          subject,
          htmlContent,
          status: "failed",
          error: errorMessage,
          smtpServerId: serverConfig.serverId,
          sentAt: new Date(),
          bounced: false,
          uniqueOpens: 0,
          uniqueClicks: 0,
          totalOpens: 0,
          totalClicks: 0,
        }).catch((createError) => {
          // Ignore duplicate key errors on failed email creation too
          const createErrorMsg =
            createError instanceof Error
              ? createError.message
              : "Unknown error";
          if (
            !createErrorMsg.includes("E11000") &&
            !createErrorMsg.includes("duplicate key")
          ) {
            console.error("Error creating failed email record:", createError);
          }
        });

        // Mark this campaign as sent in recipient's sentCampaigns array (FAILED)
        // This prevents retry in next execution
        await Recipient.findByIdAndUpdate(recipient._id, {
          $addToSet: { sentCampaigns: campaignId },
        });
      }

      await handleSendError(campaignId, recipient.email, errorMessage);
    }
  }
}

/**
 * Define Agenda jobs
 */
export function defineAgendaJobs() {
  agenda.define("process-bulk-campaign", processCampaign);
  agenda.define("process-recurring-campaign", processRecurringCampaign);
}

/**
 * Process recurring campaign (optimized)
 */
async function processRecurringCampaign(job: Job<CampaignJobData>) {
  const { campaignId } = job.attrs.data;

  try {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Check if campaign should continue
    if (campaign.schedule?.endDate && new Date() > campaign.schedule.endDate) {
      await Campaign.findByIdAndUpdate(campaignId, {
        status: "completed",
        completedAt: new Date(),
      });
      return;
    }

    // Check for duplicate execution (debounce)
    // This prevents multiple jobs from running for the same campaign within the frequency period
    if (campaign.schedule?.lastExecutedAt && campaign.schedule?.frequency) {
      const lastRun = new Date(campaign.schedule.lastExecutedAt);
      const now = new Date();
      const diffMs = now.getTime() - lastRun.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      let minIntervalHours = 0;
      switch (campaign.schedule.frequency) {
        case "daily":
          minIntervalHours = 20; // Allow some buffer (e.g. if it runs 23 hours later, it's fine)
          break;
        case "weekly":
          minIntervalHours = 24 * 6;
          break;
        case "monthly":
          minIntervalHours = 24 * 25;
          break;
      }

      if (minIntervalHours > 0 && diffHours < minIntervalHours) {
        console.log(
          `[Recurring] Skipping duplicate execution for campaign ${campaignId}. Last run: ${lastRun.toISOString()}, Now: ${now.toISOString()}`,
        );
        // Do NOT schedule next execution here, effectively killing this duplicate chain
        return;
      }
    }

    // Calculate total limit from all SMTP servers for this execution
    const totalLimit = campaign.mailServers.reduce(
      (sum: number, server: { limit: number }) => sum + server.limit,
      0,
    );

    console.log(
      `[Recurring] Campaign ${campaignId}: Total SMTP limit for this execution: ${totalLimit}`,
    );

    // For recurring campaigns, use SMTP limit as the batch size
    // This ensures full utilization of SMTP server capacity
    const effectiveBatchSize = totalLimit;

    console.log(
      `[Recurring] Campaign ${campaignId}: Batch size for this execution: ${effectiveBatchSize}`,
    );

    // Get ONLY the recipients needed for this execution (optimized query with limit)
    // For recurring campaigns, exclude recipients who already got email from this campaign
    const batch = await getActiveRecipients(
      campaign,
      campaign._id.toString(),
      effectiveBatchSize,
    );

    // Get total pending count for tracking (separate count query - faster than fetching all)
    const totalPendingCount = await Recipient.countDocuments({
      recipientListId: { $in: campaign.recipientListIds },
      unsubscribed: false,
      sentCampaigns: { $nin: [campaign._id] },
    });

    // Get total recipients count (in case list was updated after campaign creation)
    const totalRecipientsInList = await Recipient.countDocuments({
      recipientListId: { $in: campaign.recipientListIds },
      unsubscribed: false,
    });

    // Update total recipients count
    await Campaign.findByIdAndUpdate(campaignId, {
      totalRecipients: totalRecipientsInList, // Total active recipients in list
    });

    if (batch.length === 0) {
      // All recipients processed, mark as completed
      console.log(
        `[Recurring] Campaign ${campaignId} completed - all recipients processed`,
      );
      await Campaign.findByIdAndUpdate(campaignId, {
        status: "completed",
        completedAt: new Date(),
        remainingCount: 0,
      });
      return;
    }

    console.log(
      `[Recurring] Campaign ${campaignId}: Processing ${batch.length} recipients (${totalPendingCount} total pending)`,
    );

    // Reset server sent counts for new execution (daily/weekly/monthly reset)
    const resetMailServers = campaign.mailServers.map(
      (server: { serverId: unknown; limit: number; sent: number }) => ({
        serverId: server.serverId,
        limit: server.limit,
        sent: 0, // Reset sent count for this execution
      }),
    );

    // Process batch
    const { recipientsByServer } = distributeToServers(batch, resetMailServers);

    let totalSent = 0;

    for (const [serverIndex, recipients] of recipientsByServer.entries()) {
      const serverConfig = resetMailServers[serverIndex];

      await sendBatch(
        recipients as Array<{
          email: string;
          name?: string;
          customFields?: Map<string, unknown>;
        }>,
        {
          serverId: serverConfig.serverId.toString(),
          limit: serverConfig.limit,
        },
        campaign._id.toString(),
        campaign.userId,
        campaign.from || "",
        campaign.subject,
        campaign.htmlContent,
        campaign.delay,
      );

      totalSent += recipients.length;

      // Update server sent count for this execution
      resetMailServers[serverIndex].sent += recipients.length;
    }

    // Update campaign with reset server counts
    await Campaign.findByIdAndUpdate(campaignId, {
      $set: {
        mailServers: resetMailServers,
      },
    });

    // Update campaign progress in single query
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        $inc: {
          sentCount: totalSent,
        },
        $set: {
          remainingCount: totalPendingCount - totalSent,
          "schedule.lastExecutedAt": new Date(),
        },
      },
      { new: true },
    );

    // Calculate execution duration
    const executionDuration = Math.floor((Date.now() - Date.now()) / 1000); // Approximate

    // Build SMTP stats
    const smtpStats = resetMailServers.map((server: any) => ({
      serverId: server.serverId.toString(),
      serverName: "Server", // We don't have name in recurring
      sent: server.sent,
      failed: 0,
    }));

    // Send execution report
    console.log("Execution Report init");
    await sendExecutionReport({
      campaign: updatedCampaign,
      executionStartTime: new Date(Date.now() - executionDuration * 1000),
      executionEndTime: new Date(),
      executionDuration,
      totalSent,
      totalFailed: 0,
      smtpStats,
      remainingCount: updatedCampaign?.remainingCount || 0,
    });
    console.log("Execution Report has been sended");
    console.log("=".repeat(60));
    console.log("✅ JOB EXECUTION COMPLETED");
    console.log(`📧 Sent in this execution: ${totalSent}`);
    console.log(
      `📊 Remaining recipients: ${updatedCampaign?.remainingCount || 0}`,
    );
    console.log(`⏰ Completed at: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    // Schedule next execution only if there are remaining recipients
    if (
      campaign.schedule?.frequency &&
      updatedCampaign &&
      updatedCampaign.remainingCount > 0
    ) {
      const nextDate = calculateNextExecutionDate(
        new Date(),
        campaign.schedule.frequency,
      );

      console.log("\n" + "=".repeat(60));
      console.log("📅 SCHEDULING NEXT EXECUTION");
      console.log(`⏰ Next execution at: ${nextDate.toISOString()}`);
      console.log(`📊 Remaining to send: ${updatedCampaign.remainingCount}`);
      console.log("=".repeat(60) + "\n");

      // Reschedule the same job instead of creating new one
      job.attrs.nextRunAt = nextDate;
      await job.save();
    } else {
      // Mark as completed if no more recipients
      console.log("\n" + "=".repeat(60));
      console.log("🎉 CAMPAIGN FULLY COMPLETED");
      console.log(`📧 All recipients processed`);
      console.log(`⏰ Completed at: ${new Date().toISOString()}`);
      console.log("=".repeat(60) + "\n");

      await Campaign.findByIdAndUpdate(campaignId, {
        status: "completed",
        completedAt: new Date(),
        remainingCount: 0,
      });
    }
  } catch (error) {
    console.log("=".repeat(60));
    console.log("❌ JOB FAILED");
    console.log(
      `🚨 Error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    console.log(`⏰ Failed at: ${new Date().toISOString()}`);
    console.log("=".repeat(60));

    await Campaign.findByIdAndUpdate(campaignId, {
      $set: {
        status: "failed",
        completedAt: new Date(),
      },
    });

    throw error;
  }
}

/**
 * Calculate next execution date for recurring campaigns
 */
function calculateNextExecutionDate(
  currentDate: Date,
  frequency: "daily" | "weekly" | "monthly",
): Date {
  const nextDate = new Date(currentDate);

  switch (frequency) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  return nextDate;
}
