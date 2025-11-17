import { ClickEvent, Email, OpenEvent } from "@/db/models";

interface DashboardStats {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  openRate: number;
  clickRate: number;
  ctr: number;
  bounceRate: number;
  timeline: TimelineData[];
}

interface EmailStats {
  openRate: number;
  clickRate: number;
  ctr: number;
  bounceRate: number;
}

interface TimelineData {
  date: string;
  opens: number;
  clicks: number;
}

/**
 * Calculate open rate percentage
 */
export function calculateOpenRate(sent: number, uniqueOpens: number): number {
  if (sent === 0) return 0;
  return Number.parseFloat(((uniqueOpens / sent) * 100).toFixed(2));
}

/**
 * Calculate click rate percentage (clicks / opens)
 */
export function calculateClickRate(
  uniqueOpens: number,
  uniqueClicks: number,
): number {
  if (uniqueOpens === 0) return 0;
  return Number.parseFloat(((uniqueClicks / uniqueOpens) * 100).toFixed(2));
}

/**
 * Calculate click-through rate percentage (clicks / sent)
 */
export function calculateCTR(sent: number, uniqueClicks: number): number {
  if (sent === 0) return 0;
  return Number.parseFloat(((uniqueClicks / sent) * 100).toFixed(2));
}

/**
 * Calculate bounce rate percentage
 */
export function calculateBounceRate(sent: number, bounces: number): number {
  if (sent === 0) return 0;
  return Number.parseFloat(((bounces / sent) * 100).toFixed(2));
}

/**
 * Get dashboard statistics for a user
 */
export async function getDashboardStats(
  userId: string,
): Promise<DashboardStats> {
  // Get all emails for the user
  const emails = await Email.find({ userId });

  const totalSent = emails.length;
  const totalOpens = emails.reduce((sum, email) => sum + email.uniqueOpens, 0);
  const totalClicks = emails.reduce(
    (sum, email) => sum + email.uniqueClicks,
    0,
  );
  const totalBounces = emails.filter((email) => email.bounced).length;

  // Calculate rates
  const openRate = calculateOpenRate(totalSent, totalOpens);
  const clickRate = calculateClickRate(totalOpens, totalClicks);
  const ctr = calculateCTR(totalSent, totalClicks);
  const bounceRate = calculateBounceRate(totalSent, totalBounces);

  // Get timeline data (last 30 days)
  const timeline = await getTimeline(userId, 30);

  return {
    totalSent,
    totalOpens,
    totalClicks,
    totalBounces,
    openRate,
    clickRate,
    ctr,
    bounceRate,
    timeline,
  };
}

/**
 * Get email-level statistics
 */
export async function getEmailStats(emailId: string): Promise<EmailStats> {
  const email = await Email.findById(emailId);

  if (!email) {
    throw new Error("Email not found");
  }

  const openRate = calculateOpenRate(1, email.uniqueOpens);
  const clickRate = calculateClickRate(email.uniqueOpens, email.uniqueClicks);
  const ctr = calculateCTR(1, email.uniqueClicks);
  const bounceRate = email.bounced ? 100 : 0;

  return {
    openRate,
    clickRate,
    ctr,
    bounceRate,
  };
}

/**
 * Get campaign-level statistics
 */
export async function getCampaignStats(campaignId: string) {
  const emails = await Email.find({ campaignId });

  const totalSent = emails.length;
  const uniqueOpens = emails.reduce((sum, email) => sum + email.uniqueOpens, 0);
  const uniqueClicks = emails.reduce(
    (sum, email) => sum + email.uniqueClicks,
    0,
  );
  const totalBounces = emails.filter((email) => email.bounced).length;

  const openRate = calculateOpenRate(totalSent, uniqueOpens);
  const clickRate = calculateClickRate(uniqueOpens, uniqueClicks);
  const ctr = calculateCTR(totalSent, uniqueClicks);
  const bounceRate = calculateBounceRate(totalSent, totalBounces);

  return {
    totalSent,
    uniqueOpens,
    uniqueClicks,
    totalBounces,
    openRate,
    clickRate,
    ctr,
    bounceRate,
  };
}

/**
 * Get timeline data for opens and clicks
 */
export async function getTimeline(
  userId: string,
  days = 30,
): Promise<TimelineData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all emails for the user
  const emails = await Email.find({ userId }).select("_id");
  const emailIds = emails.map((email) => email._id);

  // Get opens and clicks grouped by date
  const [opens, clicks] = await Promise.all([
    OpenEvent.aggregate([
      {
        $match: {
          emailId: { $in: emailIds },
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    ClickEvent.aggregate([
      {
        $match: {
          emailId: { $in: emailIds },
          timestamp: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Create a map for easy lookup
  const opensMap = new Map(opens.map((o) => [o._id, o.count]));
  const clicksMap = new Map(clicks.map((c) => [c._id, c.count]));

  // Generate timeline for all days
  const timeline: TimelineData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    timeline.push({
      date: dateStr,
      opens: opensMap.get(dateStr) || 0,
      clicks: clicksMap.get(dateStr) || 0,
    });
  }

  return timeline;
}
