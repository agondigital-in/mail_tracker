/**
 * Migration script to populate sentCampaigns array in existing recipients
 * Run this once after deploying the new recipient model
 */

import mongoose from "mongoose";
import { Email, Recipient } from "@/db/models";

async function connectDB() {
  const dbUrl = process.env.DATABASE_URL || "mongodb://localhost:27017/mail";
  await mongoose.connect(dbUrl);
  console.log("✅ Connected to database");
}

async function migrateRecipientCampaigns() {
  try {
    console.log(
      "Starting migration: Populating sentCampaigns in recipients...",
    );

    await connectDB();

    // Get all sent/failed emails with recipient IDs
    const emails = await Email.find(
      {
        recipientId: { $exists: true, $ne: null },
        status: { $in: ["sent", "failed"] },
      },
      { recipientId: 1, campaignId: 1 },
    ).lean();

    console.log(`Found ${emails.length} emails to process`);

    // Group by recipient
    const recipientCampaigns = new Map<string, Set<string>>();

    for (const email of emails) {
      const recipientId = email.recipientId?.toString();
      const campaignId = email.campaignId?.toString();

      if (recipientId && campaignId) {
        if (!recipientCampaigns.has(recipientId)) {
          recipientCampaigns.set(recipientId, new Set());
        }
        recipientCampaigns.get(recipientId)!.add(campaignId);
      }
    }

    console.log(
      `Processing ${recipientCampaigns.size} recipients with campaign data`,
    );

    let updated = 0;
    let failed = 0;

    // Update each recipient
    for (const [recipientId, campaigns] of recipientCampaigns.entries()) {
      try {
        await Recipient.findByIdAndUpdate(recipientId, {
          $addToSet: { sentCampaigns: { $each: Array.from(campaigns) } },
        });
        updated++;

        if (updated % 100 === 0) {
          console.log(
            `Progress: ${updated}/${recipientCampaigns.size} recipients updated`,
          );
        }
      } catch (error) {
        console.error(`Failed to update recipient ${recipientId}:`, error);
        failed++;
      }
    }

    console.log("\n=== Migration Complete ===");
    console.log(`✅ Successfully updated: ${updated} recipients`);
    console.log(`❌ Failed: ${failed} recipients`);
    console.log(`📧 Total emails processed: ${emails.length}`);

    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
migrateRecipientCampaigns();
