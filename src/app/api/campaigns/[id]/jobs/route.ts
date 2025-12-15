import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Job } from "agenda";
import agenda from "@/lib/agenda";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get all jobs for this campaign
    const jobs = await agenda.jobs({
      "data.campaignId": campaignId,
    });

    const formattedJobs = jobs.map((job) => ({
      id: job.attrs._id?.toString(),
      name: job.attrs.name,
      status: getJobStatus(job),
      nextRunAt: job.attrs.nextRunAt,
      lastRunAt: job.attrs.lastRunAt,
      lastFinishedAt: job.attrs.lastFinishedAt,
      lockedAt: job.attrs.lockedAt,
      failedAt: job.attrs.failedAt,
      failReason: job.attrs.failReason,
      failCount: job.attrs.failCount || 0,
      repeatInterval: job.attrs.repeatInterval,
      data: job.attrs.data,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
    });
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

// DELETE - Remove duplicate jobs, keep only the one with earliest nextRunAt
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get all jobs for this campaign
    const jobs = await agenda.jobs({
      "data.campaignId": campaignId,
    });

    if (jobs.length <= 1) {
      return NextResponse.json({
        success: true,
        message: "No duplicate jobs found",
        removed: 0,
      });
    }

    // Sort by nextRunAt (earliest first), keep the first one
    const sortedJobs = jobs.sort((a, b) => {
      const aTime = a.attrs.nextRunAt?.getTime() || 0;
      const bTime = b.attrs.nextRunAt?.getTime() || 0;
      return aTime - bTime;
    });

    // Remove all except the first (earliest) job
    const jobsToRemove = sortedJobs.slice(1);
    let removedCount = 0;

    for (const job of jobsToRemove) {
      await job.remove();
      removedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${removedCount} duplicate job(s)`,
      removed: removedCount,
      keptJobId: sortedJobs[0].attrs._id?.toString(),
    });
  } catch (error) {
    console.error("Error removing duplicate jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove duplicate jobs" },
      { status: 500 }
    );
  }
}

function getJobStatus(job: Job): string {
  if (job.attrs.lockedAt) {
    return "running";
  }
  if (job.attrs.failedAt) {
    return "failed";
  }
  if (job.attrs.lastFinishedAt && !job.attrs.nextRunAt) {
    return "completed";
  }
  if (job.attrs.nextRunAt) {
    return "scheduled";
  }
  return "queued";
}
