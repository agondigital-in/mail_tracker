# 🌱 Quick Seed Guide

## Step-by-Step: Add Test Data to Your App

### Step 1: Find Your User ID

1. Login to your app: https://mail-tracker.agonwork.store/
2. Open MongoDB Compass or mongo shell
3. Connect to your database
4. Run this query:

```javascript
db.user.findOne({email: "ritikcollege@gmail.com"})
```

5. Copy the `_id` value (example: `"cm3xqj8hs0000rvwqvvvvvvvv"`)

### Step 2: Update Seed Script

1. Open `scripts/seed.js`
2. Find this line (around line 18):

```javascript
const TEST_USER_ID = 'user_test_123'; // Change this to your actual user ID
```

3. Replace with your actual user ID:

```javascript
const TEST_USER_ID = 'cm3xqj8hs0000rvwqvvvvvvvv'; // Your actual ID
```

### Step 3: Run Seed Script

```bash
npm run seed
```

### Step 4: Check Your Dashboard

1. Refresh your dashboard: https://mail-tracker.agonwork.store/dashboard
2. You should see:
   - ✅ 4 campaigns
   - ✅ 50 emails
   - ✅ Analytics with opens and clicks
   - ✅ Timeline chart with data

## What You'll Get

### 📊 Dashboard Stats
```
Total Sent: 50 emails
Opens: ~35 emails (70% open rate)
Clicks: ~14 emails (40% of opens)
Bounces: ~2-3 emails (5% bounce rate)
```

### 📧 Campaigns
1. **Welcome Series** - Onboarding emails
2. **Monthly Newsletter** - Updates and news
3. **Product Launch** - New product announcements
4. **Holiday Sale** - Special promotions

### 📈 Timeline Data
- Last 30 days of email activity
- Realistic open/click patterns
- Various times throughout the day

## Troubleshooting

### ❌ Error: Cannot connect to MongoDB

**Solution:**
```bash
# Make sure MongoDB is running
mongod

# Or check if it's already running
mongosh
```

### ❌ Error: User not found

**Solution:**
1. Make sure you're logged in to the app first
2. Create an account if you haven't
3. Use the correct user ID from the database

### ❌ Want to reset data?

**Solution:**
```bash
# Just run seed again - it clears old data first
npm run seed
```

## Customization

Want different data? Edit `scripts/seed.js`:

```javascript
// More emails
for (let i = 0; i < 100; i++) { // Change 50 to 100

// Higher open rate
if (Math.random() < 0.9) { // Change 0.7 to 0.9 (90%)

// More clicks
if (Math.random() < 0.6) { // Change 0.4 to 0.6 (60%)
```

## Quick Commands

```bash
# Run seed
npm run seed

# Start dev server
npm run dev

# Check MongoDB
mongosh
```

## Need Help?

1. Check `.env` file for correct MongoDB URL
2. Make sure MongoDB is running
3. Verify user account exists
4. Check console output for errors

---

**Happy Testing! 🎉**
