"use client";

import {
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  _id: string;
  name: string;
  status: string;
  type: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  schedule?: {
    type: string;
    frequency?: string;
    startDate?: string;
  };
  createdAt: string;
}

export default function CampaignManagePage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns/list");
      const data = await response.json();

      if (data.success) {
        // Filter bulk campaigns only
        const bulkCampaigns = data.campaigns.filter(
          (c: Campaign) => c.type === "bulk",
        );
        setCampaigns(bulkCampaigns);
      }
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchCampaigns, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (
    campaignId: string,
    action: "pause" | "resume" | "cancel",
  ) => {
    setActionLoading(campaignId);

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/${action}`, {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Campaign ${action}d successfully`);
        fetchCampaigns();
      } else {
        toast.error(data.error || `Failed to ${action} campaign`);
      }
    } catch (error) {
      toast.error(`Failed to ${action} campaign`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRecovery = async () => {
    setActionLoading("recovery");

    try {
      const response = await fetch("/api/campaigns/recover", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        toast.success(
          `Recovery completed: ${data.recovered} recovered, ${data.skipped} skipped`,
        );
        fetchCampaigns();
      } else {
        toast.error(data.error || "Failed to recover campaigns");
      }
    } catch (error) {
      toast.error("Failed to recover campaigns");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "scheduled":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "paused":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const canPause = (status: string) => status === "processing";
  const canResume = (status: string) => status === "paused" || status === "cancelled";
  const canCancel = (status: string) =>
    ["processing", "paused", "scheduled"].includes(status);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Campaign Management</h1>
        <p className="text-muted-foreground text-lg">
          Control and monitor all bulk campaigns
        </p>
      </div>

      {/* Recovery Section */}
      <Card className="mb-6 border-l-4 border-l-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5" />
            Campaign Recovery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            If campaigns are not running after server restart, use this to
            recover and reschedule them.
          </p>
          <Button
            onClick={handleRecovery}
            disabled={actionLoading === "recovery"}
            className="gap-2"
          >
            <RefreshCw
              className={`w-4 h-4 ${actionLoading === "recovery" ? "animate-spin" : ""}`}
            />
            {actionLoading === "recovery"
              ? "Recovering..."
              : "Recover Campaigns"}
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card>
        <CardHeader>
          <CardTitle>All Campaigns ({campaigns.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No bulk campaigns found
            </p>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {campaign.name}
                        </h3>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}
                        >
                          {campaign.status}
                        </span>
                        {campaign.schedule?.type === "recurring" && (
                          <span className="text-xs px-2 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-200">
                            {campaign.schedule.frequency}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          Sent: {campaign.sentCount}/{campaign.totalRecipients}
                        </span>
                        {campaign.failedCount > 0 && (
                          <span className="text-red-600">
                            Failed: {campaign.failedCount}
                          </span>
                        )}
                        <span>
                          Created:{" "}
                          {new Date(campaign.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {canPause(campaign.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(campaign._id, "pause")}
                          disabled={actionLoading === campaign._id}
                          className="gap-2"
                        >
                          <Pause className="w-4 h-4" />
                          Pause
                        </Button>
                      )}

                      {canResume(campaign.status) && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(campaign._id, "resume")}
                          disabled={actionLoading === campaign._id}
                          className="gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Resume
                        </Button>
                      )}

                      {canCancel(campaign.status) && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleAction(campaign._id, "cancel")}
                          disabled={actionLoading === campaign._id}
                          className="gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          (window.location.href = `/dashboard/campaigns/${campaign._id}/monitor`)
                        }
                      >
                        Monitor
                      </Button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {campaign.totalRecipients > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>
                          {Math.round(
                            (campaign.sentCount / campaign.totalRecipients) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(campaign.sentCount / campaign.totalRecipients) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Status Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm">
                <strong>Completed:</strong> All emails sent
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              <span className="text-sm">
                <strong>Processing:</strong> Currently sending
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Pause className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">
                <strong>Paused:</strong> Temporarily stopped
              </span>
            </div>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-purple-600" />
              <span className="text-sm">
                <strong>Scheduled:</strong> Waiting to start
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm">
                <strong>Failed:</strong> Execution error
              </span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm">
                <strong>Cancelled:</strong> Manually stopped
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
