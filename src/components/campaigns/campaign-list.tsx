import { Calendar, Clock, Edit, Eye, Repeat } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  type?: string;
  status?: string;
  totalRecipients?: number;
  sentCount?: number;
  schedule?: {
    type?: string;
    startDate?: string;
    frequency?: string;
    lastExecutedAt?: string;
  };
  createdAt: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
}

function getStatusColor(status?: string) {
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

function calculateNextExecution(campaign: Campaign): {
  date: string;
  relative: string;
  isPending?: boolean;
} | null {
  if (!campaign.schedule) return null;

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
    } else if (campaign.status === "scheduled" && !lastExecutedAt) {
      // Past date but not executed yet - show as pending/imminent
      isPending = true;
      nextExec = now; // Will show "Pending"
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

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">No campaigns yet</p>
          <p className="text-sm text-muted-foreground mt-2">
            Create your first campaign to organize your emails
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {campaigns.map((campaign) => {
        const nextExecution = calculateNextExecution(campaign);
        const isBulk = campaign.type === "bulk";

        return (
          <Card
            key={campaign._id}
            className="hover:shadow-lg transition-shadow"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg flex-1">
                  {campaign.name}
                </CardTitle>
                {campaign.status && (
                  <span
                    className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(campaign.status)}`}
                  >
                    {campaign.status}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {campaign.description}
                </p>
              )}

              {isBulk && (
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sent:</span>{" "}
                    <span className="font-semibold">
                      {campaign.sentCount || 0}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>{" "}
                    <span className="font-semibold">
                      {campaign.totalRecipients || 0}
                    </span>
                  </div>
                </div>
              )}

              {campaign.schedule?.type === "recurring" && (
                <div className="flex items-center gap-2 text-sm text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
                  <Repeat className="w-4 h-4" />
                  <span className="capitalize">
                    {campaign.schedule.frequency}
                  </span>
                </div>
              )}

              {nextExecution && (
                <div
                  className={`flex items-start gap-2 text-sm px-3 py-2 rounded-md ${nextExecution.isPending ? "bg-orange-50 border border-orange-200" : "bg-blue-50"}`}
                >
                  <Clock
                    className={`w-4 h-4 mt-0.5 flex-shrink-0 ${nextExecution.isPending ? "text-orange-600" : "text-blue-600"}`}
                  />
                  <div className="flex-1">
                    <p
                      className={`font-medium ${nextExecution.isPending ? "text-orange-600" : "text-blue-600"}`}
                    >
                      Next Execution
                    </p>
                    <p
                      className={`font-semibold ${nextExecution.isPending ? "text-orange-800" : "text-blue-800"}`}
                    >
                      {nextExecution.relative}
                    </p>
                    <p
                      className={`text-xs mt-0.5 ${nextExecution.isPending ? "text-orange-600" : "text-blue-600"}`}
                    >
                      📅 {nextExecution.date}
                    </p>
                    {nextExecution.isPending && (
                      <p className="text-xs text-orange-700 mt-1">
                        ⚠️ Overdue - will start soon
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                Created: {new Date(campaign.createdAt).toLocaleDateString()}
              </div>

              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/campaigns/${campaign._id}`}>
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                </Button>
                {campaign.status !== "processing" && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/campaigns/${campaign._id}/edit`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                )}
                {isBulk && campaign.status !== "completed" && (
                  <Button asChild variant="default" size="sm">
                    <Link href={`/dashboard/campaigns/${campaign._id}/monitor`}>
                      Monitor
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
