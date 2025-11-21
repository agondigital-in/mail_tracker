# Recipient Campaign Tracking - Implementation

## Problem
Recurring campaigns mein same recipients ko baar baar emails ja rahi thi, causing:
- Duplicate key errors (E11000)
- SMTP daily quota exhaustion
- Campaign kabhi complete nahi ho rahi thi

## Solution: Recipient-Level Campaign Tracking

### 1. Database Schema Update

**Recipient Model** - Added `sentCampaigns` array:
```typescript
sentCampaigns: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Campaign",
  },
]
```

### 2. Query Optimization

**Before:**
```typescript
// Step 1: Get all recipients
const allRecipients = await Recipient.find({ ... });

// Step 2: Query Email collection for sent emails
const processedEmails = await Email.find({ campaignId, status: ["sent", "failed"] });

// Step 3: Filter in memory
const pending = allRecipients.filter(r => !processedEmails.includes(r._id));
```

**After:**
```typescript
// Single optimized query - filter at database level
const pendingRecipients = await Recipient.find({
  recipientListId: { $in: campaign.recipientListIds },
  unsubscribed: false,
  sentCampaigns: { $nin: [campaignId] }, // Exclude already sent
});
```

### 3. Update on Send

When email is successfully sent:
```typescript
await sendEmail({ ... });

// Mark campaign as sent in recipient
await Recipient.findByIdAndUpdate(recipientId, {
  $addToSet: { sentCampaigns: campaignId }
});
```

### 4. Benefits

✅ **Performance**
- Single database query instead of 3 queries
- No in-memory filtering
- Indexed query on sentCampaigns array

✅ **Reliability**
- No duplicate sends
- Proper campaign completion
- Graceful handling of quota limits

✅ **Data Integrity**
- Recipient knows which campaigns it's part of
- Easy to query: "Which recipients haven't received Campaign X?"
- Historical tracking

✅ **Scalability**
- Works with millions of recipients
- Efficient MongoDB array queries
- No performance degradation

## Migration

For existing data, run migration script:

```bash
npm run migrate:recipient-campaigns
```

This will:
1. Query all sent/failed emails
2. Group by recipient
3. Update each recipient's sentCampaigns array
4. Show progress and completion stats

## Usage Examples

### Check if recipient received campaign
```typescript
const recipient = await Recipient.findOne({
  email: "user@example.com",
  sentCampaigns: campaignId
});

if (recipient) {
  console.log("Already sent to this recipient");
}
```

### Get recipients who haven't received campaign
```typescript
const pending = await Recipient.find({
  recipientListId: listId,
  sentCampaigns: { $nin: [campaignId] }
});
```

### Get all campaigns sent to a recipient
```typescript
const recipient = await Recipient.findOne({ email: "user@example.com" })
  .populate('sentCampaigns', 'name createdAt');

console.log(`Sent ${recipient.sentCampaigns.length} campaigns to this recipient`);
```

## Testing

1. Create a recurring campaign with 100 recipients
2. Set batch size to 20
3. Run campaign - should send 20 emails
4. Check recipient documents - 20 should have campaignId in sentCampaigns
5. Next execution - should only process remaining 80 recipients
6. Repeat until all 100 are processed
7. Campaign should mark as "completed"

## Monitoring

Check logs for:
```
Processing batch for campaign XXX: 20 recipients (80 pending total)
Scheduling next execution for campaign XXX at 2025-11-21T...
Campaign XXX completed - no more recipients remaining
```

## Rollback

If needed to rollback:
1. Remove `sentCampaigns` field from Recipient model
2. Revert to old Email collection query logic
3. Run: `db.recipients.updateMany({}, { $unset: { sentCampaigns: "" } })`
