import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Campaign {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

interface CampaignListProps {
  campaigns: Campaign[];
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
      {campaigns.map((campaign) => (
        <Card key={campaign._id}>
          <CardHeader>
            <CardTitle className="text-lg">{campaign.name}</CardTitle>
          </CardHeader>
          <CardContent>
            {campaign.description && (
              <p className="text-sm text-muted-foreground mb-4">
                {campaign.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mb-4">
              Created: {new Date(campaign.createdAt).toLocaleDateString()}
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/dashboard/campaigns/${campaign._id}`}>
                View Details
              </Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
