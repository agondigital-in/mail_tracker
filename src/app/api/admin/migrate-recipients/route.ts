import { type NextRequest, NextResponse } from "next/server";
import { Email, Recipient } from "@/db/models";
import { auth } from "@/lib/auth";

/**
 * Migration endpoint to populate sentCampaigns array in existing recipients
 * POST /api/admin/migrate-recipients
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        },
        { status: 401 },
      );
    }

    // Optional: Add admin check here
    // if (session.user.role !== 'admin') {
    //   return NextResponse.json(
    //     { success: false, error: "Admin access required" },
    //     { status: 403 }
    //   );
    // }

    console.log(
      `[Migration] Started by user: ${session.user.email || session.user.id}`,
    );

    // Get all sent/failed emails with recipient IDs
    const emails = await Email.find(
      {
        recipientId: { $exists: true, $ne: null },
        status: { $in: ["sent", "failed"] },
      },
      { recipientId: 1, campaignId: 1 },
    ).lean();

    console.log(`[Migration] Found ${emails.length} emails to process`);

    if (emails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No emails to process",
        stats: {
          emailsProcessed: 0,
          recipientsUpdated: 0,
          failed: 0,
        },
      });
    }

    // Group by recipient
    const recipientCampaigns = new Map<string, Set<string>>();

    for (const email of emails) {
      const recipientId = email.recipientId?.toString();
      const campaignId = email.campaignId?.toString();

      if (recipientId && campaignId) {
        if (!recipientCampaigns.has(recipientId)) {
          recipientCampaigns.set(recipientId, new Set());
        }
        const campaigns = recipientCampaigns.get(recipientId);
        if (campaigns) {
          campaigns.add(campaignId);
        }
      }
    }

    console.log(
      `[Migration] Processing ${recipientCampaigns.size} recipients with campaign data`,
    );

    let updated = 0;
    let failed = 0;
    const errors: Array<{ recipientId: string; error: string }> = [];

    // Update each recipient
    for (const [recipientId, campaigns] of recipientCampaigns.entries()) {
      try {
        await Recipient.findByIdAndUpdate(recipientId, {
          $addToSet: { sentCampaigns: { $each: Array.from(campaigns) } },
        });
        updated++;

        if (updated % 100 === 0) {
          console.log(
            `[Migration] Progress: ${updated}/${recipientCampaigns.size} recipients updated`,
          );
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `[Migration] Failed to update recipient ${recipientId}:`,
          errorMessage,
        );
        failed++;
        errors.push({ recipientId, error: errorMessage });
      }
    }

    console.log("\n[Migration] === Complete ===");
    console.log(`[Migration] ✅ Successfully updated: ${updated} recipients`);
    console.log(`[Migration] ❌ Failed: ${failed} recipients`);
    console.log(`[Migration] 📧 Total emails processed: ${emails.length}`);

    return NextResponse.json({
      success: true,
      message: "Migration completed successfully",
      stats: {
        emailsProcessed: emails.length,
        recipientsUpdated: updated,
        failed: failed,
        totalRecipients: recipientCampaigns.size,
      },
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined, // Return first 10 errors
    });
  } catch (error) {
    console.error("[Migration] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: error instanceof Error ? error.message : "Unknown error",
        code: "MIGRATION_ERROR",
      },
      { status: 500 },
    );
  }
}

/**
 * Get migration status
 * GET /api/admin/migrate-recipients
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required",
          code: "AUTH_REQUIRED",
        },
        { status: 401 },
      );
    }

    // Count recipients with and without sentCampaigns
    const totalRecipients = await Recipient.countDocuments();
    const recipientsWithCampaigns = await Recipient.countDocuments({
      sentCampaigns: { $exists: true, $ne: [] },
    });
    const recipientsWithoutCampaigns = totalRecipients - recipientsWithCampaigns;

    // Count total sent/failed emails
    const totalEmails = await Email.countDocuments({
      recipientId: { $exists: true, $ne: null },
      status: { $in: ["sent", "failed"] },
    });

    // Sample check - get a few recipients with their campaign counts
    const sampleRecipients = await Recipient.find({
      sentCampaigns: { $exists: true, $ne: [] },
    })
      .limit(5)
      .select("email sentCampaigns")
      .lean();

    return NextResponse.json({
      success: true,
      status: {
        totalRecipients,
        recipientsWithCampaigns,
        recipientsWithoutCampaigns,
        migrationNeeded: recipientsWithoutCampaigns > 0 && totalEmails > 0,
        totalEmailsToProcess: totalEmails,
      },
      sample: sampleRecipients.map((r) => ({
        email: r.email,
        campaignCount: r.sentCampaigns?.length || 0,
      })),
    });
  } catch (error) {
    console.error("[Migration Status] Failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to get migration status",
        details: error instanceof Error ? error.message : "Unknown error",
        code: "STATUS_ERROR",
      },
      { status: 500 },
    );
  }
}
