"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
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
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || "Campaign not found"}</p>
          <Button asChild>
            <Link href="/dashboard/campaigns">Back to Campaigns</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/dashboard/campaigns">← Back to Campaigns</Link>
        </Button>
        <h1 className="text-3xl font-bold">{data.campaign.name}</h1>
        {data.campaign.description && (
          <p className="text-muted-foreground mt-2">
            {data.campaign.description}
          </p>
        )}
        <p className="text-sm text-muted-foreground mt-1">
          Created: {new Date(data.campaign.createdAt).toLocaleDateString()}
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.totalSent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Opens</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.stats.uniqueOpens}</div>
              <p className="text-xs text-muted-foreground">
                {data.stats.openRate}% rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Clicks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.uniqueClicks}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.stats.ctr}% CTR
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Bounces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.stats.totalBounces}
              </div>
              <p className="text-xs text-muted-foreground">
                {data.stats.bounceRate}% rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Emails in Campaign ({data.emails.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {data.emails.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No emails in this campaign yet
              </p>
            ) : (
              <div className="space-y-2">
                {data.emails.map((email) => (
                  <div
                    key={email._id}
                    className="border rounded-md p-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{email.subject}</p>
                        <p className="text-sm text-muted-foreground">
                          To: {email.to}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(email.sentAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className="text-sm">
                          <span className="font-medium">
                            {email.uniqueOpens}
                          </span>{" "}
                          opens
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {email.uniqueClicks}
                          </span>{" "}
                          clicks
                        </div>
                        {email.bounced && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">
                            Bounced
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="mt-2"
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
    </div>
  );
}
