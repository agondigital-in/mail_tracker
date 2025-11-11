import { Campaign, Email } from "@/db/models";

interface CreateCampaignData {
  name: string;
  description?: string;
}

interface CampaignStats {
  totalSent: number;
  uniqueOpens: number;
  uniqueClicks: number;
  totalBounces: number;
  openRate: number;
  clickRate: number;
  ctr: number;
  bounceRate: number;
}

/**
 * Create a new campaign
 */
export async function createCampaign(userId: string, data: CreateCampaignData) {
  const campaign = await Campaign.create({
    userId,
    name: data.name,
    description: data.description,
  });

  return campaign;
}

/**
 * Get campaign by ID with authorization check
 */
export async function getCampaignById(campaignId: string, userId: string) {
  const campaign = await Campaign.findOne({
    _id: campaignId,
    userId,
  });

  return campaign;
}

/**
 * List user's campaigns
 */
export async function listCampaigns(userId: string) {
  const campaigns = await Campaign.find({ userId }).sort({ createdAt: -1 });

  return campaigns;
}

/**
 * Get campaign statistics
 */
export async function getCampaignStats(
  campaignId: string,
): Promise<CampaignStats> {
  // Get all emails in the campaign
  const emails = await Email.find({ campaignId });

  const totalSent = emails.length;
  const uniqueOpens = emails.reduce((sum, email) => sum + email.uniqueOpens, 0);
  const uniqueClicks = emails.reduce(
    (sum, email) => sum + email.uniqueClicks,
    0,
  );
  const totalBounces = emails.filter((email) => email.bounced).length;

  // Calculate rates
  const openRate = totalSent > 0 ? (uniqueOpens / totalSent) * 100 : 0;
  const clickRate = uniqueOpens > 0 ? (uniqueClicks / uniqueOpens) * 100 : 0;
  const ctr = totalSent > 0 ? (uniqueClicks / totalSent) * 100 : 0;
  const bounceRate = totalSent > 0 ? (totalBounces / totalSent) * 100 : 0;

  return {
    totalSent,
    uniqueOpens,
    uniqueClicks,
    totalBounces,
    openRate: Number.parseFloat(openRate.toFixed(2)),
    clickRate: Number.parseFloat(clickRate.toFixed(2)),
    ctr: Number.parseFloat(ctr.toFixed(2)),
    bounceRate: Number.parseFloat(bounceRate.toFixed(2)),
  };
}
