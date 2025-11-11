"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CampaignForm } from "@/components/campaigns/campaign-form";
import { CampaignList } from "@/components/campaigns/campaign-list";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = () => {
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
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleSuccess = (campaignId: string) => {
    fetchCampaigns();
    router.push(`/dashboard/campaigns/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Campaigns</h1>
        <p className="text-muted-foreground mt-2">
          Organize and track your email campaigns
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <CampaignForm onSuccess={handleSuccess} />
        </div>
        <div className="lg:col-span-2">
          <CampaignList campaigns={campaigns} />
        </div>
      </div>
    </div>
  );
}
