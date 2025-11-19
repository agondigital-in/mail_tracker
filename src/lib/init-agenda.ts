import { Campaign } from "@/db/models";
import { defineAgendaJobs } from "@/services/campaign-job-processor.service";
import agenda, { startAgenda } from "./agenda";

let isInitializing = false;
let isInitialized = false;

/**
 * Resume pending campaigns after server restart
 */
async function resumePendingCampaigns() {
  try {
    console.log("🔄 Checking for pending campaigns to resume...");

    // Find campaigns that should be running but might have been interrupted
    const pendingCampaigns = await Campaign.find({
      status: { $in: ["scheduled", "processing"] },
      type: "bulk",
    });

    if (pendingCampaigns.length === 0) {
      console.log("✅ No pending campaigns to resume");
      return;
    }

    console.log(`📋 Found ${pendingCampaigns.length} pending campaign(s)`);

    for (const campaign of pendingCampaigns) {
      // Check if job already exists in Agenda
      const existingJobs = await agenda.jobs({
        "data.campaignId": campaign._id.toString(),
      });

      // If job exists but campaign is stuck (processing with remaining emails)
      if (existingJobs.length > 0) {
        const job = existingJobs[0];
        
        // Check if campaign is stuck:
        // 1. Status is "processing" with remaining emails
        // 2. Job finished/failed but campaign incomplete
        // 3. Job is running but no progress for 5+ minutes
        const now = new Date();
        const lastRun = job.attrs.lastRunAt || job.attrs.nextRunAt;
        const timeSinceLastRun = lastRun ? (now.getTime() - new Date(lastRun).getTime()) / 1000 / 60 : 0; // minutes
        
        const isStuck = campaign.status === "processing" && 
                       campaign.remainingCount > 0 &&
                       (
                         job.attrs.lastFinishedAt || // Job finished but campaign incomplete
                         job.attrs.failedAt || // Job failed
                         timeSinceLastRun > 5 // No progress for 5+ minutes
                       );

        if (isStuck) {
          console.log(
            `🔄 Campaign "${campaign.name}" is stuck (remaining: ${campaign.remainingCount}, idle: ${timeSinceLastRun.toFixed(1)}min), removing old job and restarting...`,
          );
          // Remove stuck job
          await job.remove();
        } else {
          console.log(
            `✓ Campaign "${campaign.name}" already has scheduled job`,
          );
          continue;
        }
      }

      // Reschedule the campaign
      const jobName =
        campaign.schedule?.type === "recurring"
          ? "process-recurring-campaign"
          : "process-bulk-campaign";

      let job;

      if (campaign.status === "processing") {
        // Resume immediately if it was processing
        console.log(`▶️ Resuming campaign "${campaign.name}" immediately`);
        job = await agenda.now(jobName, {
          campaignId: campaign._id.toString(),
        });
      } else if (
        campaign.status === "scheduled" &&
        campaign.schedule?.startDate
      ) {
        const startDate = new Date(campaign.schedule.startDate);
        const now = new Date();

        if (startDate <= now) {
          // Start immediately if scheduled time has passed
          console.log(
            `▶️ Starting overdue campaign "${campaign.name}" immediately`,
          );
          job = await agenda.now(jobName, {
            campaignId: campaign._id.toString(),
          });
        } else {
          // Schedule for future
          console.log(
            `⏰ Rescheduling campaign "${campaign.name}" for ${startDate.toLocaleString()}`,
          );
          job = await agenda.schedule(startDate, jobName, {
            campaignId: campaign._id.toString(),
          });
        }
      }

      // Update campaign with new job ID
      if (job) {
        await Campaign.findByIdAndUpdate(campaign._id, {
          agendaJobId: job.attrs._id?.toString(),
        });
        console.log(`✅ Campaign "${campaign.name}" resumed successfully`);
      }
    }

    console.log("✅ All pending campaigns processed");
  } catch (error) {
    console.error("❌ Error resuming pending campaigns:", error);
  }
}

/**
 * Initialize Agenda and define all jobs
 * Call this once when the application starts
 */
export async function initializeAgenda() {
  // Prevent multiple initializations
  if (isInitialized) {
    console.log("Agenda already initialized");
    return;
  }

  if (isInitializing) {
    console.log("Agenda initialization in progress...");
    return;
  }

  isInitializing = true;

  try {
    // Define all job handlers
    defineAgendaJobs();

    // Start Agenda
    await startAgenda();

    // Resume pending campaigns after restart
    await resumePendingCampaigns();

    isInitialized = true;
    console.log("✅ Agenda initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Agenda:", error);
    isInitializing = false;
    throw error;
  }
}

// Auto-initialize on module load (for Next.js API routes)
if (typeof window === "undefined") {
  initializeAgenda().catch((err) => {
    console.error("Auto-initialization failed:", err);
  });
}
