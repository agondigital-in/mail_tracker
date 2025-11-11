# Seed Scripts

## Overview

This folder contains utility scripts for the Email Tracking & Analytics application.

## Available Scripts

### 1. `seed.js` - Test Data Generator

Generates realistic test data for development and testing.

#### What It Creates:

- **4 Campaigns** with different themes
- **50 Emails** distributed across campaigns
- **Open Events** (70% open rate with realistic patterns)
- **Click Events** (40% of opened emails get clicks)
- **Bounce Events** (5% bounce rate)

#### Usage:

```bash
# Run the seed script
npm run seed
```

#### Before Running:

1. **Update User ID** in `scripts/seed.js`:
   ```javascript
   const TEST_USER_ID = 'your_actual_user_id_here';
   ```

2. **Find Your User ID:**
   - Login to your app
   - Open MongoDB Compass or mongo shell
   - Query the `user` collection:
     ```javascript
     db.user.find({email: "ritikcollege@gmail.com"})
     ```
   - Copy the `_id` field value

3. **Ensure MongoDB is running:**
   ```bash
   # Check if MongoDB is running
   mongosh
   ```

#### What Happens:

1. ✅ Connects to MongoDB
2. 🗑️ Clears existing test data for the user
3. 📧 Creates 4 campaigns
4. 📨 Creates 50 emails (last 30 days)
5. 👁️ Creates open events (realistic patterns)
6. 🖱️ Creates click events (for opened emails)
7. ⚠️ Creates bounce events (5% of emails)

#### Output Example:

```
🌱 Starting seed process...

📍 Connecting to MongoDB: mongodb://localhost:27017/mail
✅ Connected to MongoDB

🗑️ Clearing existing test data...
✅ Cleared existing data

📧 Creating campaigns...
✅ Created 4 campaigns

📨 Creating emails...
✅ Created 50 emails

👁️ Creating open events...
✅ Created 142 open events

🖱️ Creating click events...
✅ Created 38 click events

⚠️ Creating bounce events...
✅ Created 3 bounce events

🎉 Seed completed successfully!

📊 Summary:
   - Campaigns: 4
   - Emails: 50
   - Opens: 142
   - Clicks: 38
   - Bounces: 3

✅ Test data ready! Login with user ID: user_test_123

👋 Disconnected from MongoDB
```

#### Realistic Data Patterns:

**Email Distribution:**
- Sent over last 30 days
- Random times throughout the day
- Various recipients and subjects

**Open Patterns:**
- 70% open rate (industry average)
- 1-5 opens per email
- Some immediate opens (bots/scanners)
- Most opens within 24 hours
- Gmail proxy detection included

**Click Patterns:**
- 40% of opened emails get clicks
- 1-3 clicks per email
- Clicks happen after opens
- Various destination URLs

**Bounce Patterns:**
- 5% bounce rate
- 70% hard bounces, 30% soft bounces
- Realistic bounce reasons

#### Customization:

Edit `scripts/seed.js` to customize:

```javascript
// Number of emails
for (let i = 0; i < 50; i++) { // Change 50 to any number

// Open rate
if (Math.random() < 0.7) { // Change 0.7 (70%) to desired rate

// Click rate
if (Math.random() < 0.4) { // Change 0.4 (40%) to desired rate

// Bounce rate
bounced: Math.random() < 0.05, // Change 0.05 (5%) to desired rate
```

#### Troubleshooting:

**Error: Cannot connect to MongoDB**
```bash
# Start MongoDB
mongod
```

**Error: User ID not found**
- Make sure you've created a user account first
- Update TEST_USER_ID with your actual user ID

**Error: Duplicate key error**
- The script clears data before seeding
- If error persists, manually clear collections:
  ```javascript
  db.campaigns.deleteMany({})
  db.emails.deleteMany({})
  db.open_events.deleteMany({})
  db.click_events.deleteMany({})
  db.bounce_events.deleteMany({})
  ```

---

### 2. `create-ethereal-account.js` - Ethereal Email Setup

Creates a test email account for development.

#### Usage:

```bash
node scripts/create-ethereal-account.js
```

---

## Tips

1. **Run seed after fresh install** to see the app with data
2. **Re-run seed anytime** to reset test data
3. **Customize patterns** in seed.js for specific testing scenarios
4. **Check MongoDB** after seeding to verify data

## Need Help?

- Check MongoDB connection in `.env`
- Ensure user account exists before seeding
- Review console output for detailed errors
