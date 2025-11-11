import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  openRate: number;
  clickRate: number;
  ctr: number;
  bounceRate: number;
}

export function StatsCards({
  totalSent,
  totalOpens,
  totalClicks,
  totalBounces,
  openRate,
  clickRate,
  ctr,
  bounceRate,
}: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalSent}</div>
          <p className="text-xs text-muted-foreground">Emails sent</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Opens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOpens}</div>
          <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Clicks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalClicks}</div>
          <p className="text-xs text-muted-foreground">
            {ctr}% click-through rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bounces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalBounces}</div>
          <p className="text-xs text-muted-foreground">
            {bounceRate}% bounce rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
