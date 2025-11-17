"use client";

import { FolderKanban } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CampaignList } from "@/components/campaigns/campaign-list";
import { CreateCampaignDialog } from "@/components/campaigns/create-campaign-dialog";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = useCallback(() => {
    fetch("/api/campaigns/list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setCampaigns(data.campaigns);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching campaigns:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleSuccess = (campaignId: string) => {
    fetchCampaigns();
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <FolderKanban className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Campaigns</h1>
          </div>
          <p className="text-muted-foreground text-lg ml-15">
            Organize and track your email campaigns
          </p>
        </div>
        <CreateCampaignDialog onSuccess={handleSuccess} />
      </div>

      <CampaignList campaigns={campaigns} />
    </div>
  );
}
