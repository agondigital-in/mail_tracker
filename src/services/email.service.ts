import nodemailer from "nodemailer";
import { randomBytes } from "crypto";
import { Email } from "@/db/models";

// Create SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

interface SendEmailData {
  userId: string;
  to: string;
  subject: string;
  html: string;
  campaignId?: string;
}

/**
 * Generate a unique tracking identifier
 */
export function generateTrackingId(): string {
  return randomBytes(16).toString("hex");
}

/**
 * Process HTML content to inject tracking pixel and convert URLs to tracked links
 */
export function processHtmlContent(html: string, trackingId: string): string {
  const baseUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000";

  // Inject tracking pixel at the end of the body
  const trackingPixel = `<img src="${baseUrl}/api/track/open?id=${trackingId}" width="1" height="1" style="display:none;" alt="" />`;

  // Add tracking pixel before closing body tag, or at the end if no body tag
  let processedHtml = html;
  if (html.includes("</body>")) {
    processedHtml = html.replace("</body>", `${trackingPixel}</body>`);
  } else {
    processedHtml = `${html}${trackingPixel}`;
  }

  // Convert all URLs in href attributes to tracked links
  processedHtml = processedHtml.replace(
    /href=["']([^"']+)["']/gi,
    (match, url) => {
      // Skip if it's already a tracking link or an anchor link
      if (url.startsWith("#") || url.includes("/api/track/click")) {
        return match;
      }

      const trackedUrl = `${baseUrl}/api/track/click?id=${trackingId}&url=${encodeURIComponent(url)}`;
      return `href="${trackedUrl}"`;
    },
  );

  return processedHtml;
}

/**
 * Send email with tracking
 */
export async function sendEmail(data: SendEmailData) {
  const { userId, to, subject, html, campaignId } = data;

  // Generate tracking ID
  const trackingId = generateTrackingId();

  // Process HTML content
  const processedHtml = processHtmlContent(html, trackingId);

  // Send email via SMTP
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject,
    html: processedHtml,
  });

  // Store email record in database
  const email = await Email.create({
    userId,
    campaignId: campaignId || undefined,
    trackingId,
    to,
    from: from || "",
    subject,
    htmlContent: processedHtml,
    sentAt: new Date(),
    bounced: false,
    uniqueOpens: 0,
    uniqueClicks: 0,
    totalOpens: 0,
    totalClicks: 0,
  });

  return {
    trackingId,
    emailId: email._id.toString(),
  };
}

/**
 * Get email by ID with authorization check
 */
export async function getEmailById(emailId: string, userId: string) {
  const email = await Email.findOne({
    _id: emailId,
    userId,
  });

  return email;
}

/**
 * List emails with pagination and filtering
 */
export async function listEmails(
  userId: string,
  filters: {
    page?: number;
    limit?: number;
    campaignId?: string;
  } = {},
) {
  const { page = 1, limit = 20, campaignId } = filters;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { userId };
  if (campaignId) {
    query.campaignId = campaignId;
  }

  const [emails, total] = await Promise.all([
    Email.find(query)
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("campaignId", "name"),
    Email.countDocuments(query),
  ]);

  return {
    emails,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
