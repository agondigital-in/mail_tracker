"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Loader2,
  Pause,
  Play,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExecutionLogs } from "@/components/campaigns/execution-logs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CampaignProgress {
  success: boolean;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  remainingCount: number;
  rate: number;
  failedRecipients: Array<{ email: string; error: string }>;
  campaign?: {
    name: string;
    schedule?: {
      type: string;
      frequency?: string;
      startDate?: string;
      lastExecutedAt?: string;
    };
  };
}

interface CampaignJob {
  id: string;
  name: string;
  status: "running" | "scheduled" | "completed" | "failed" | "queued";
  nextRunAt?: string;
  lastRunAt?: string;
  lastFinishedAt?: string;
  lockedAt?: string;
  failedAt?: string;
  failReason?: string;
  failCount: number;
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffSecs < 60) {
    return `in ${Math.max(0, diffSecs)} second${diffSecs !== 1 ? "s" : ""}`;
  }
  if (diffMins < 60) {
    return `in ${diffMins} minute${diffMins !== 1 ? "s" : ""}`;
  }
  if (diffHours < 24) {
    const mins = diffMins % 60;
    return `in ${diffHours} hour${diffHours !== 1 ? "s" : ""}${mins > 0 ? ` ${mins} min` : ""}`;
  }
  if (diffDays < 7) {
    const hours = diffHours % 24;
    return `in ${diffDays} day${diffDays !== 1 ? "s" : ""}${hours > 0 ? ` ${hours} hr` : ""}`;
  }
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `in ${weeks} week${weeks !== 1 ? "s" : ""}`;
  }
  const months = Math.floor(diffDays / 30);
  return `in ${months} month${months !== 1 ? "s" : ""}`;
}

function calculateNextExecution(
  campaign?: {
    schedule?: {
      type: string;
      frequency?: string;
      startDate?: string;
      lastExecutedAt?: string;
    };
  },
  status?: string,
): { date: string; relative: string; isPending?: boolean } | null {
  if (!campaign?.schedule) return null;

  const { type, startDate, frequency, lastExecutedAt } = campaign.schedule;
  let nextExec: Date | null = null;
  let isPending = false;

  // For scheduled or recurring (first time), use startDate
  if ((type === "scheduled" || type === "recurring") && startDate) {
    const scheduleDate = new Date(startDate);
    const now = new Date();

    if (scheduleDate > now) {
      // Future date
      nextExec = scheduleDate;
    } else if (status === "scheduled" && !lastExecutedAt) {
      // Past date but not executed yet - show as pending/imminent
      isPending = true;
      nextExec = now; // Will show "in less than a minute"
    }
  }

  // For recurring (after first execution), calculate next based on lastExecutedAt
  if (type === "recurring" && frequency && lastExecutedAt) {
    const lastExec = new Date(lastExecutedAt);
    const calculated = new Date(lastExec);

    switch (frequency) {
      case "daily":
        calculated.setDate(calculated.getDate() + 1);
        break;
      case "weekly":
        calculated.setDate(calculated.getDate() + 7);
        break;
      case "monthly":
        calculated.setMonth(calculated.getMonth() + 1);
        break;
    }

    if (calculated > new Date()) {
      nextExec = calculated;
    }
  }

  if (!nextExec) return null;

  return {
    date: nextExec.toLocaleString(),
    relative: isPending ? "Pending - Starting soon" : getRelativeTime(nextExec),
    isPending,
  };
}

export default function CampaignMonitorPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState<string>("");
  const [jobs, setJobs] = useState<CampaignJob[]>([]);

  const fetchProgress = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/progress`);
      const data = await response.json();

      if (data.success) {
        setProgress(data);
      }
    } catch (_error) {
      console.error("Failed to fetch progress");
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/jobs`);
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs);
      }
    } catch (_error) {
      console.error("Failed to fetch jobs");
    }
  };

  useEffect(() => {
    fetchProgress();
    fetchJobs();
    const progressInterval = setInterval(fetchProgress, 5000); // Poll every 5 seconds
    const jobsInterval = setInterval(fetchJobs, 5000);
    return () => {
      clearInterval(progressInterval);
      clearInterval(jobsInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Update countdown every second
  useEffect(() => {
    if (!progress?.campaign?.schedule) return;

    const updateCountdown = () => {
      const nextExec = calculateNextExecution(
        progress.campaign,
        progress.status,
      );
      if (nextExec && !nextExec.isPending) {
        setCountdown(nextExec.relative);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [progress]);

  const handlePause = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Campaign paused");
        fetchProgress();
      } else {
        toast.error(data.error);
      }
    } catch (_error) {
      toast.error("Failed to pause campaign");
    }
  };

  const handleResume = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/resume`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Campaign resumed");
        fetchProgress();
      } else {
        toast.error(data.error);
      }
    } catch (_error) {
      toast.error("Failed to resume campaign");
    }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign?")) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Campaign cancelled");
        fetchProgress();
      } else {
        toast.error(data.error);
      }
    } catch (_error) {
      toast.error("Failed to cancel campaign");
    }
  };

  const handleDeleteDuplicateJobs = async () => {
    if (!confirm("Remove duplicate jobs? Only the earliest scheduled job will be kept.")) return;

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/jobs`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        fetchJobs();
      } else {
        toast.error(data.error);
      }
    } catch (_error) {
      toast.error("Failed to remove duplicate jobs");
    }
  };

  if (loading) {
    return <div className="container mx-auto py-8 px-4">Loading...</div>;
  }

  if (!progress) {
    return (
      <div className="container mx-auto py-8 px-4">Campaign not found</div>
    );
  }

  const progressPercent =
    progress.totalRecipients > 0
      ? (progress.sentCount / progress.totalRecipients) * 100
      : 0;

  const nextExecution = calculateNextExecution(
    progress.campaign,
    progress.status,
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/dashboard/campaigns">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">
          {progress.campaign?.name || "Campaign Monitor"}
        </h1>
        <div className="flex items-center gap-4">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              progress.status === "completed"
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : progress.status === "processing"
                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  : progress.status === "paused"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
            }`}
          >
            {progress.status}
          </span>
          {progress.campaign?.schedule?.type === "recurring" && (
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
              <Repeat className="w-4 h-4" />
              <span className="capitalize">
                {progress.campaign.schedule.frequency}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {/* Schedule Information */}
        {progress.campaign?.schedule && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Next Execution */}
            {nextExecution && (
              <Card
                className={`border-l-4 ${nextExecution.isPending ? "border-l-orange-500 bg-orange-50/50 dark:bg-orange-950/30" : "border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/30"}`}
              >
                <CardHeader>
                  <CardTitle
                    className={`flex items-center gap-2 text-lg ${nextExecution.isPending ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"}`}
                  >
                    <Clock
                      className={`w-5 h-5 ${nextExecution.isPending ? "text-orange-600 dark:text-orange-400" : "text-blue-600 dark:text-blue-400"}`}
                    />
                    Next Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p
                    className={`text-3xl font-bold ${nextExecution.isPending ? "text-orange-900 dark:text-orange-300" : "text-blue-900 dark:text-blue-300"}`}
                  >
                    {countdown || nextExecution.relative}
                  </p>
                  <div
                    className={`flex items-center gap-2 text-sm ${nextExecution.isPending ? "text-orange-700 dark:text-orange-400" : "text-blue-700 dark:text-blue-400"}`}
                  >
                    <Calendar className="w-4 h-4" />
                    <p>{nextExecution.date}</p>
                  </div>
                  {nextExecution.isPending && (
                    <div className="mt-2 p-2 bg-orange-100 dark:bg-orange-900/30 rounded text-xs text-orange-800 dark:text-orange-300">
                      ⚠️ Campaign will start processing shortly
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Start Time */}
            {progress.campaign.schedule.startDate && (
              <Card className="border-l-4 border-l-purple-500 dark:border-l-purple-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    {progress.campaign.schedule.type === "recurring"
                      ? "First Execution"
                      : "Scheduled Time"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">
                    {new Date(
                      progress.campaign.schedule.startDate,
                    ).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Last Execution (for recurring) */}
            {progress.campaign.schedule.lastExecutedAt && (
              <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
                    Last Execution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-semibold">
                    {new Date(
                      progress.campaign.schedule.lastExecutedAt,
                    ).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Campaign Progress</CardTitle>
              <div className="flex gap-2">
                {progress.status === "processing" && (
                  <Button onClick={handlePause} variant="outline" size="sm">
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                )}
                {progress.status === "paused" && (
                  <Button onClick={handleResume} size="sm">
                    <Play className="w-4 h-4 mr-2" />
                    Resume
                  </Button>
                )}
                {(progress.status === "processing" ||
                  progress.status === "paused" ||
                  progress.status === "scheduled") && (
                  <Button
                    onClick={handleCancel}
                    variant="destructive"
                    size="sm"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Overall Progress</span>
                <span className="font-semibold">
                  {progress.sentCount} / {progress.totalRecipients}
                </span>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <p className="text-xs text-muted-foreground mt-1">
                {progressPercent.toFixed(1)}% complete
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-gray-500 dark:border-l-gray-400">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-bold">
                    {progress.totalRecipients}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500 dark:border-l-green-400">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Sent</p>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {progress.sentCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500 dark:border-l-blue-400">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">
                    Remaining
                  </p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {progress.remainingCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500 dark:border-l-red-400">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {progress.failedCount}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Sending Rate
                    </p>
                    <p className="text-2xl font-semibold">
                      {progress.rate}{" "}
                      <span className="text-sm">emails/min</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {progress.failedRecipients && progress.failedRecipients.length > 0 && (
          <Card className="border-l-4 border-l-red-500 dark:border-l-red-400">
            <CardHeader>
              <CardTitle className="text-red-600 dark:text-red-400">
                Failed Recipients ({progress.failedRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {progress.failedRecipients.map((failed, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-red-50/50 dark:bg-red-950/30 dark:border-red-800"
                  >
                    <p className="font-medium text-sm">{failed.email}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">{failed.error}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Running Jobs */}
        {jobs.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5" />
                  Campaign Jobs ({jobs.length})
                </CardTitle>
                {jobs.length > 1 && (
                  <Button
                    onClick={handleDeleteDuplicateJobs}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Duplicates
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className={`border rounded-lg p-4 ${
                      job.status === "running"
                        ? "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800"
                        : job.status === "failed"
                          ? "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800"
                          : job.status === "scheduled"
                            ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-800"
                            : "bg-gray-50 border-gray-200 dark:bg-gray-800/50 dark:border-gray-700"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {job.status === "running" && (
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                        )}
                        <span className="font-medium">{job.name}</span>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.status === "running"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300"
                            : job.status === "failed"
                              ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                              : job.status === "scheduled"
                                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                : job.status === "completed"
                                  ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                  : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {job.nextRunAt && (
                        <div>
                          <span className="font-medium">Next Run:</span>{" "}
                          {new Date(job.nextRunAt).toLocaleString()}
                        </div>
                      )}
                      {job.lastRunAt && (
                        <div>
                          <span className="font-medium">Last Run:</span>{" "}
                          {new Date(job.lastRunAt).toLocaleString()}
                        </div>
                      )}
                      {job.lockedAt && (
                        <div>
                          <span className="font-medium">Started:</span>{" "}
                          {new Date(job.lockedAt).toLocaleString()}
                        </div>
                      )}
                      {job.failCount > 0 && (
                        <div className="text-red-600 dark:text-red-400">
                          <span className="font-medium">Fail Count:</span>{" "}
                          {job.failCount}
                        </div>
                      )}
                    </div>
                    {job.failReason && (
                      <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs text-red-800 dark:text-red-300">
                        {job.failReason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Execution Logs */}
        <ExecutionLogs campaignId={campaignId} />
      </div>
    </div>
  );
}
