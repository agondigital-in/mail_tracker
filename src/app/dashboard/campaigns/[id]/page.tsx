"use client";

import {
  ArrowLeft,
  FolderKanban,
  Mail,
  MailOpen,
  MailX,
  MousePointerClick,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CampaignData {
  campaign: {
    _id: string;
    name: string;
    description?: string;
    createdAt: string;
  };
  stats: {
    totalSent: number;
    uniqueOpens: number;
    uniqueClicks: number;
    totalBounces: number;
    openRate: number;
    clickRate: number;
    ctr: number;
    bounceRate: number;
  };
  emails: Array<{
    _id: string;
    to: string;
    subject: string;
    sentAt: string;
    uniqueOpens: number;
    uniqueClicks: number;
    bounced: boolean;
  }>;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [data, setData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params.id as string;

    fetch(`/api/campaigns/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to load campaign");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching campaign:", err);
        setError("Network error");
        setLoading(false);
      });
  }, [params.id]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Campaign not found"}</p>
          <Button asChild>
            <Link href="/dashboard/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Generate timeline data from emails
  const timeline = data.emails
    .reduce(
      (acc: Array<{ date: string; opens: number; clicks: number }>, email) => {
        const date = new Date(email.sentAt).toISOString().split("T")[0];
        const existing = acc.find((item) => item.date === date);

        if (existing) {
          existing.opens += email.uniqueOpens;
          existing.clicks += email.uniqueClicks;
        } else {
          acc.push({
            date,
            opens: email.uniqueOpens,
            clicks: email.uniqueClicks,
          });
        }

        return acc;
      },
      [],
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      <div>
        <Button asChild variant="outline" className="mb-4 gap-2">
          <Link href="/dashboard/campaigns">
            <ArrowLeft className="w-4 h-4" />
            Back to Campaigns
          </Link>
        </Button>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
            <FolderKanban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              {data.campaign.name}
            </h1>
            {data.campaign.description && (
              <p className="text-muted-foreground text-lg mt-1">
                {data.campaign.description}
              </p>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground ml-15">
          Created on {new Date(data.campaign.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
              <Mail className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              {data.stats.totalSent}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Emails in campaign
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opens</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <MailOpen className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
              {data.stats.uniqueOpens}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.openRate}% open rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <MousePointerClick className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
              {data.stats.uniqueClicks}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.ctr}% click-through rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounces</CardTitle>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
              <MailX className="w-5 h-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              {data.stats.totalBounces}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.stats.bounceRate}% bounce rate
            </p>
          </CardContent>
        </Card>
      </div>

      {timeline.length > 0 && <AnalyticsChart timeline={timeline} />}

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Emails in Campaign ({data.emails.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.emails.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <p className="text-muted-foreground mb-4 text-lg">
                No emails in this campaign yet
              </p>
              <Button asChild size="lg" className="gap-2">
                <Link href="/dashboard/compose">
                  <Mail className="w-4 h-4" />
                  Send First Email
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {data.emails.map((email) => (
                <div
                  key={email._id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-all duration-300 hover:shadow-md"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-semibold text-lg">{email.subject}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3" />
                        To: {email.to}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(email.sentAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-4 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MailOpen className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{email.uniqueOpens}</span>
                        <span className="text-muted-foreground">opens</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MousePointerClick className="w-4 h-4 text-purple-600" />
                        <span className="font-medium">
                          {email.uniqueClicks}
                        </span>
                        <span className="text-muted-foreground">clicks</span>
                      </div>
                      {email.bounced && (
                        <div className="flex items-center gap-1">
                          <MailX className="w-4 h-4 text-red-600" />
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Bounced
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                  >
                    <Link href={`/dashboard/emails/${email._id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
