import { NextResponse } from "next/server";
import { Campaign } from "@/db/models";
import agenda from "@/lib/agenda";
import { auth } from "@/lib/auth";

/**
 * Manual recovery endpoint to check and resume campaigns
 * Useful for debugging or manual intervention
 */
export async function POST(request: Request) {
  try {
    // Check authentication (optional - can be admin only)
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

    // Find user's pending campaigns
    const pendingCampaigns = await Campaign.find({
      userId,
      status: { $in: ["scheduled", "processing"] },
      type: "bulk",
    });

    const recovered = [];
    const skipped = [];

    for (const campaign of pendingCampaigns) {
      // Check if job exists
      const existingJobs = await agenda.jobs({
        "data.campaignId": campaign._id.toString(),
      });

      if (existingJobs.length > 0) {
        skipped.push({
          id: campaign._id,
          name: campaign.name,
          reason: "Job already exists",
        });
        continue;
      }

      // Reschedule
      const jobName =
        campaign.schedule?.type === "recurring"
          ? "process-recurring-campaign"
          : "process-bulk-campaign";

      let job;

      if (campaign.status === "processing") {
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
          job = await agenda.now(jobName, {
            campaignId: campaign._id.toString(),
          });
        } else {
          job = await agenda.schedule(startDate, jobName, {
            campaignId: campaign._id.toString(),
          });
        }
      }

      if (job) {
        await Campaign.findByIdAndUpdate(campaign._id, {
          agendaJobId: job.attrs._id?.toString(),
        });

        recovered.push({
          id: campaign._id,
          name: campaign.name,
          status: campaign.status,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Campaign recovery completed",
      recovered: recovered.length,
      skipped: skipped.length,
      details: {
        recovered,
        skipped,
      },
    });
  } catch (error) {
    console.error("Error recovering campaigns:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to recover campaigns",
      },
      { status: 500 },
    );
  }
}
