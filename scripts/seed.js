/**
 * Seed Script for Email Tracking & Analytics
 *
 * This script generates test data for development and testing:
 * - Campaigns
 * - Emails with tracking
 * - Open events
 * - Click events
 * - Bounce events
 *
 * Usage: node scripts/seed.js
 */

const mongoose = require("mongoose");
const { randomBytes } = require("node:crypto");

// Load environment variables
require("dotenv").config();

// MongoDB connection
const MONGODB_URI =
  process.env.DATABASE_URL || "mongodb://localhost:27017/mail";

// Test user ID (use your actual user ID from the database)
const TEST_USER_ID = "691310e1ee4eb0ee2866efbb"; // Change this to your actual user ID

// Sample data
const SAMPLE_RECIPIENTS = [
  "john.doe@example.com",
  "jane.smith@example.com",
  "bob.wilson@example.com",
  "alice.johnson@example.com",
  "charlie.brown@example.com",
  "diana.prince@example.com",
  "edward.stark@example.com",
  "fiona.gallagher@example.com",
];

const SAMPLE_SUBJECTS = [
  "Welcome to Our Newsletter!",
  "Special Offer: 50% Off Today Only",
  "Your Weekly Update",
  "Important: Account Security Notice",
  "New Features Released",
  "Thank You for Your Purchase",
  "Invitation: Exclusive Webinar",
  "Monthly Report - January 2024",
];

const SAMPLE_URLS = [
  "https://example.com/products",
  "https://example.com/blog",
  "https://example.com/about",
  "https://example.com/contact",
  "https://example.com/pricing",
  "https://example.com/features",
];

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "GoogleImageProxy", // Gmail bot
  "node", // Automated scanner
];

const IP_ADDRESSES = [
  "103.50.23.145",
  "192.168.1.100",
  "10.0.0.50",
  "172.16.0.25",
  "203.45.67.89",
  "34.229.131.136", // AWS IP (bot)
];

// Helper functions
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(start, end) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

function generateTrackingId() {
  return randomBytes(16).toString("hex");
}

// Define schemas
const campaignSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    description: String,
  },
  { timestamps: true, collection: "campaigns" },
);

const emailSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
    trackingId: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    from: { type: String, required: true },
    subject: { type: String, required: true },
    htmlContent: { type: String, required: true },
    sentAt: { type: Date, required: true },
    firstOpenAt: Date,
    firstClickAt: Date,
    bounced: { type: Boolean, default: false },
    bounceReason: String,
    bounceType: { type: String, enum: ["hard", "soft"] },
    uniqueOpens: { type: Number, default: 0 },
    uniqueClicks: { type: Number, default: 0 },
    totalOpens: { type: Number, default: 0 },
    totalClicks: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "emails" },
);

const openEventSchema = new mongoose.Schema(
  {
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: true,
    },
    trackingId: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    isGmailProxy: { type: Boolean, default: false },
    isUnique: { type: Boolean, default: false },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true, collection: "open_events" },
);

const clickEventSchema = new mongoose.Schema(
  {
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: true,
    },
    trackingId: { type: String, required: true },
    destinationUrl: { type: String, required: true },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    isUnique: { type: Boolean, default: false },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true, collection: "click_events" },
);

const bounceEventSchema = new mongoose.Schema(
  {
    emailId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Email",
      required: true,
    },
    trackingId: { type: String, required: true },
    recipientEmail: { type: String, required: true },
    bounceType: { type: String, enum: ["hard", "soft"], required: true },
    reason: { type: String, required: true },
    timestamp: { type: Date, required: true },
  },
  { timestamps: true, collection: "bounce_events" },
);

// Models
const Campaign =
  mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
const Email = mongoose.models.Email || mongoose.model("Email", emailSchema);
const OpenEvent =
  mongoose.models.OpenEvent || mongoose.model("OpenEvent", openEventSchema);
const ClickEvent =
  mongoose.models.ClickEvent || mongoose.model("ClickEvent", clickEventSchema);
const BounceEvent =
  mongoose.models.BounceEvent ||
  mongoose.model("BounceEvent", bounceEventSchema);

// Seed functions
async function seedCampaigns() {
  console.log("📧 Creating campaigns...");

  const campaigns = [
    {
      userId: TEST_USER_ID,
      name: "Welcome Series",
      description: "Onboarding emails for new users",
    },
    {
      userId: TEST_USER_ID,
      name: "Monthly Newsletter",
      description: "Monthly updates and news",
    },
    {
      userId: TEST_USER_ID,
      name: "Product Launch",
      description: "New product announcement campaign",
    },
    {
      userId: TEST_USER_ID,
      name: "Holiday Sale",
      description: "Special holiday promotions",
    },
  ];

  const createdCampaigns = await Campaign.insertMany(campaigns);
  console.log(`✅ Created ${createdCampaigns.length} campaigns`);

  return createdCampaigns;
}

async function seedEmails(campaigns) {
  console.log("📨 Creating emails...");

  const emails = [];
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Create 50 emails
  for (let i = 0; i < 50; i++) {
    const campaign = randomElement(campaigns);
    const trackingId = generateTrackingId();
    const sentAt = randomDate(thirtyDaysAgo, now);
    const recipient = randomElement(SAMPLE_RECIPIENTS);
    const subject = randomElement(SAMPLE_SUBJECTS);

    const email = {
      userId: TEST_USER_ID,
      campaignId: campaign._id,
      trackingId,
      to: recipient,
      from: "noreply@example.com",
      subject,
      htmlContent: `<h1>${subject}</h1><p>This is a test email.</p><a href="${randomElement(SAMPLE_URLS)}">Click here</a>`,
      sentAt,
      bounced: Math.random() < 0.05, // 5% bounce rate
      uniqueOpens: 0,
      uniqueClicks: 0,
      totalOpens: 0,
      totalClicks: 0,
    };

    // Add bounce details if bounced
    if (email.bounced) {
      email.bounceType = Math.random() < 0.7 ? "hard" : "soft";
      email.bounceReason =
        email.bounceType === "hard" ? "Mailbox does not exist" : "Mailbox full";
    }

    emails.push(email);
  }

  const createdEmails = await Email.insertMany(emails);
  console.log(`✅ Created ${createdEmails.length} emails`);

  return createdEmails;
}

async function seedOpenEvents(emails) {
  console.log("👁️ Creating open events...");

  const openEvents = [];

  for (const email of emails) {
    if (email.bounced) continue; // Bounced emails don't get opened

    // 70% of emails get opened
    if (Math.random() < 0.7) {
      const numOpens = randomInt(1, 5); // 1-5 opens per email

      for (let i = 0; i < numOpens; i++) {
        const openTime = new Date(
          email.sentAt.getTime() + randomInt(60000, 86400000),
        ); // 1 min to 24 hours after send
        const userAgent =
          i === 0 && Math.random() < 0.3
            ? "GoogleImageProxy"
            : randomElement(USER_AGENTS);

        openEvents.push({
          emailId: email._id,
          trackingId: email.trackingId,
          ipAddress: randomElement(IP_ADDRESSES),
          userAgent,
          isGmailProxy: userAgent.includes("GoogleImageProxy"),
          isUnique: i === 0,
          timestamp: openTime,
        });

        // Update email record
        if (i === 0) {
          email.firstOpenAt = openTime;
          email.uniqueOpens = 1;
        }
        email.totalOpens++;
      }
    }
  }

  if (openEvents.length > 0) {
    await OpenEvent.insertMany(openEvents);
    console.log(`✅ Created ${openEvents.length} open events`);
  }

  // Update email records
  for (const email of emails) {
    if (email.totalOpens > 0) {
      await Email.updateOne(
        { _id: email._id },
        {
          $set: {
            firstOpenAt: email.firstOpenAt,
            uniqueOpens: email.uniqueOpens,
            totalOpens: email.totalOpens,
          },
        },
      );
    }
  }
}

async function seedClickEvents(emails) {
  console.log("🖱️ Creating click events...");

  const clickEvents = [];

  for (const email of emails) {
    if (email.bounced || email.totalOpens === 0) continue; // Only opened emails can have clicks

    // 40% of opened emails get clicks
    if (Math.random() < 0.4) {
      const numClicks = randomInt(1, 3); // 1-3 clicks per email

      for (let i = 0; i < numClicks; i++) {
        const clickTime = new Date(
          (email.firstOpenAt || email.sentAt).getTime() +
            randomInt(10000, 3600000),
        ); // 10 sec to 1 hour after open

        clickEvents.push({
          emailId: email._id,
          trackingId: email.trackingId,
          destinationUrl: randomElement(SAMPLE_URLS),
          ipAddress: randomElement(IP_ADDRESSES),
          userAgent: randomElement(
            USER_AGENTS.filter((ua) => !ua.includes("Proxy") && ua !== "node"),
          ),
          isUnique: i === 0,
          timestamp: clickTime,
        });

        // Update email record
        if (i === 0) {
          email.firstClickAt = clickTime;
          email.uniqueClicks = 1;
        }
        email.totalClicks++;
      }
    }
  }

  if (clickEvents.length > 0) {
    await ClickEvent.insertMany(clickEvents);
    console.log(`✅ Created ${clickEvents.length} click events`);
  }

  // Update email records
  for (const email of emails) {
    if (email.totalClicks > 0) {
      await Email.updateOne(
        { _id: email._id },
        {
          $set: {
            firstClickAt: email.firstClickAt,
            uniqueClicks: email.uniqueClicks,
            totalClicks: email.totalClicks,
          },
        },
      );
    }
  }
}

async function seedBounceEvents(emails) {
  console.log("⚠️ Creating bounce events...");

  const bounceEvents = [];

  for (const email of emails) {
    if (email.bounced) {
      bounceEvents.push({
        emailId: email._id,
        trackingId: email.trackingId,
        recipientEmail: email.to,
        bounceType: email.bounceType,
        reason: email.bounceReason,
        timestamp: new Date(email.sentAt.getTime() + randomInt(1000, 60000)), // 1 sec to 1 min after send
      });
    }
  }

  if (bounceEvents.length > 0) {
    await BounceEvent.insertMany(bounceEvents);
    console.log(`✅ Created ${bounceEvents.length} bounce events`);
  }
}

// Main seed function
async function seed() {
  try {
    console.log("🌱 Starting seed process...\n");
    console.log(`📍 Connecting to MongoDB: ${MONGODB_URI}`);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Clear existing data
    console.log("🗑️ Clearing existing test data...");
    await Campaign.deleteMany({ userId: TEST_USER_ID });
    await Email.deleteMany({ userId: TEST_USER_ID });
    await OpenEvent.deleteMany({});
    await ClickEvent.deleteMany({});
    await BounceEvent.deleteMany({});
    console.log("✅ Cleared existing data\n");

    // Seed data
    const campaigns = await seedCampaigns();
    const emails = await seedEmails(campaigns);
    await seedOpenEvents(emails);
    await seedClickEvents(emails);
    await seedBounceEvents(emails);

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📊 Summary:");
    console.log(`   - Campaigns: ${campaigns.length}`);
    console.log(`   - Emails: ${emails.length}`);
    console.log(`   - Opens: ${await OpenEvent.countDocuments()}`);
    console.log(`   - Clicks: ${await ClickEvent.countDocuments()}`);
    console.log(`   - Bounces: ${await BounceEvent.countDocuments()}`);
    console.log(`\n✅ Test data ready! Login with user ID: ${TEST_USER_ID}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("\n👋 Disconnected from MongoDB");
  }
}

// Run seed
seed();
