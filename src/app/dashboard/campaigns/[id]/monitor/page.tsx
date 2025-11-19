"use client";

import { ArrowLeft, Pause, Play, X } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function CampaignMonitorPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Link href="/dashboard/campaigns">
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Campaigns
        </Button>
      </Link>

      <h1 className="text-4xl font-bold mb-8">Campaign Monitor</h1>

      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">
              Status: {progress.status}
            </h2>
            <div className="flex gap-2">
              {progress.status === "processing" && (
                <Button onClick={handlePause} variant="outline">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {progress.status === "paused" && (
                <Button onClick={handleResume}>
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {(progress.status === "processing" ||
                progress.status === "paused") && (
                <Button onClick={handleCancel} variant="destructive">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>
                  {progress.sentCount} / {progress.totalRecipients}
                </span>
              </div>
              <Progress value={progressPercent} />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="border rounded p-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{progress.totalRecipients}</p>
              </div>
              <div className="border rounded p-4">
                <p className="text-sm text-muted-foreground">Sent</p>
                <p className="text-2xl font-bold text-green-600">
                  {progress.sentCount}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="text-2xl font-bold text-blue-600">
                  {progress.remainingCount}
                </p>
              </div>
              <div className="border rounded p-4">
                <p className="text-sm text-muted-foreground">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {progress.failedCount}
                </p>
              </div>
            </div>

            <div className="border rounded p-4">
              <p className="text-sm text-muted-foreground">Sending Rate</p>
              <p className="text-xl font-semibold">
                {progress.rate} emails/min
              </p>
            </div>
          </div>
        </div>

        {progress.failedRecipients && progress.failedRecipients.length > 0 && (
          <div className="border rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4">Failed Recipients</h3>
            <div className="space-y-2">
              {progress.failedRecipients.map((failed: any, index: number) => (
                <div key={index} className="border-b pb-2">
                  <p className="font-medium">{failed.email}</p>
                  <p className="text-sm text-red-600">{failed.error}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
