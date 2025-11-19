"use client";

import {
  ArrowLeft,
  Calendar,
  Clock,
  Pause,
  Play,
  Repeat,
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

  useEffect(() => {
    fetchProgress();
    const interval = setInterval(fetchProgress, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  // Update countdown every second
  useEffect(() => {
    if (!progress?.campaign?.schedule) return;

    const updateCountdown = () => {
      const nextExec = calculateNextExecution(progress.campaign, progress.status);
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

  const nextExecution = calculateNextExecution(progress.campaign, progress.status);

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
                ? "bg-green-100 text-green-800"
                : progress.status === "processing"
                  ? "bg-blue-100 text-blue-800"
                  : progress.status === "paused"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800"
            }`}
          >
            {progress.status}
          </span>
          {progress.campaign?.schedule?.type === "recurring" && (
            <div className="flex items-center gap-2 text-sm text-purple-600">
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
              <Card className={`border-l-4 ${nextExecution.isPending ? "border-l-orange-500 bg-orange-50/50" : "border-l-blue-500 bg-blue-50/50"}`}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 text-lg ${nextExecution.isPending ? "text-orange-700" : "text-blue-700"}`}>
                    <Clock className={`w-5 h-5 ${nextExecution.isPending ? "text-orange-600" : "text-blue-600"}`} />
                    Next Execution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className={`text-3xl font-bold ${nextExecution.isPending ? "text-orange-900" : "text-blue-900"}`}>
                    {countdown || nextExecution.relative}
                  </p>
                  <div className={`flex items-center gap-2 text-sm ${nextExecution.isPending ? "text-orange-700" : "text-blue-700"}`}>
                    <Calendar className="w-4 h-4" />
                    <p>{nextExecution.date}</p>
                  </div>
                  {nextExecution.isPending && (
                    <div className="mt-2 p-2 bg-orange-100 rounded text-xs text-orange-800">
                      ⚠️ Campaign will start processing shortly
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Start Time */}
            {progress.campaign.schedule.startDate && (
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
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
              <Card className="border-l-4 border-l-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-green-600" />
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
              <Card className="border-l-4 border-l-gray-500">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                  <p className="text-3xl font-bold">{progress.totalRecipients}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Sent</p>
                  <p className="text-3xl font-bold text-green-600">
                    {progress.sentCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {progress.remainingCount}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground mb-1">Failed</p>
                  <p className="text-3xl font-bold text-red-600">
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
                    <p className="text-sm text-muted-foreground">Sending Rate</p>
                    <p className="text-2xl font-semibold">
                      {progress.rate} <span className="text-sm">emails/min</span>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {progress.failedRecipients && progress.failedRecipients.length > 0 && (
          <Card className="border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="text-red-600">
                Failed Recipients ({progress.failedRecipients.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {progress.failedRecipients.map((failed, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-3 bg-red-50/50"
                  >
                    <p className="font-medium text-sm">{failed.email}</p>
                    <p className="text-xs text-red-600 mt-1">{failed.error}</p>
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
