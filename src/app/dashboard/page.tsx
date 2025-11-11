"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { AnalyticsChart } from "@/components/dashboard/analytics-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardData {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  openRate: number;
  clickRate: number;
  ctr: number;
  bounceRate: number;
  timeline: Array<{ date: string; opens: number; clicks: number }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/dashboard")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Email tracking and analytics overview
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/compose">Compose Email</Link>
        </Button>
      </div>

      <div className="space-y-6">
        <StatsCards
          totalSent={data.totalSent}
          totalOpens={data.totalOpens}
          totalClicks={data.totalClicks}
          totalBounces={data.totalBounces}
          openRate={data.openRate}
          clickRate={data.clickRate}
          ctr={data.ctr}
          bounceRate={data.bounceRate}
        />

        <AnalyticsChart timeline={data.timeline} />

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/compose">Send New Email</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/campaigns">View Campaigns</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/dashboard/emails">View All Emails</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Emails
                </span>
                <span className="text-sm font-medium">{data.totalSent}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Engagement Rate
                </span>
                <span className="text-sm font-medium">{data.openRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">
                  Conversion Rate
                </span>
                <span className="text-sm font-medium">{data.ctr}%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
