"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FolderKanban } from "lucide-react";
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
			<div className="container mx-auto py-8 px-4 max-w-7xl">
				<div className="text-center">Loading...</div>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-7xl">
			<div className="mb-8">
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
