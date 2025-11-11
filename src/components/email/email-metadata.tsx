import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EmailMetadataProps {
  email: {
    to: string;
    from: string;
    subject: string;
    sentAt: string;
    trackingId: string;
    uniqueOpens: number;
    uniqueClicks: number;
    totalOpens: number;
    totalClicks: number;
    bounced: boolean;
    bounceReason?: string;
    campaignId?: { name: string };
  };
}

export function EmailMetadata({ email }: EmailMetadataProps) {
  const openRate = email.uniqueOpens > 0 ? 100 : 0;
  const clickRate =
    email.uniqueOpens > 0 ? (email.uniqueClicks / email.uniqueOpens) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Recipient</p>
            <p className="font-medium">{email.to}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">From</p>
            <p className="font-medium">{email.from}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Subject</p>
            <p className="font-medium">{email.subject}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Sent At</p>
            <p className="font-medium">
              {new Date(email.sentAt).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Tracking ID</p>
            <p className="font-mono text-xs">{email.trackingId}</p>
          </div>
          {email.campaignId && (
            <div>
              <p className="text-sm text-muted-foreground">Campaign</p>
              <p className="font-medium">{email.campaignId.name}</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">Engagement Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Unique Opens</p>
              <p className="text-2xl font-bold">{email.uniqueOpens}</p>
              <p className="text-xs text-muted-foreground">
                {openRate.toFixed(1)}% rate
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Opens</p>
              <p className="text-2xl font-bold">{email.totalOpens}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Unique Clicks</p>
              <p className="text-2xl font-bold">{email.uniqueClicks}</p>
              <p className="text-xs text-muted-foreground">
                {clickRate.toFixed(1)}% rate
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clicks</p>
              <p className="text-2xl font-bold">{email.totalClicks}</p>
            </div>
          </div>
        </div>

        {email.bounced && (
          <div className="border-t pt-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm font-semibold text-red-800">
                Email Bounced
              </p>
              {email.bounceReason && (
                <p className="text-sm text-red-700 mt-1">
                  {email.bounceReason}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
