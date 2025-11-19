# Campaign Recovery System

## 🔄 How It Works

### On Server Start:
1. **Agenda Initializes** - Connects to MongoDB
2. **Job Handlers Defined** - `process-bulk-campaign` and `process-recurring-campaign`
3. **Auto-Recovery Runs** - Checks for pending campaigns

### Recovery Logic:

```
┌─────────────────────────────────────────┐
│ Server Starts                           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ Find campaigns with status:             │
│ • "scheduled"                           │
│ • "processing"                          │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ For each campaign:                      │
│                                         │
│ 1. Check if Agenda job exists          │
│    ├─ Yes → Skip (already scheduled)   │
│    └─ No → Continue                     │
│                                         │
│ 2. If status = "processing"            │
│    └─ Resume immediately                │
│                                         │
│ 3. If status = "scheduled"             │
│    ├─ Start date passed → Start now    │
│    └─ Future date → Reschedule         │
│                                         │
│ 4. Update campaign.agendaJobId         │
└─────────────────────────────────────────┘
```

## ✅ What Gets Recovered:

### Scenario 1: Processing Campaign
```
Before Restart:
- Status: "processing"
- Sent: 50/100 emails

After Restart:
✅ Resumes immediately
✅ Continues from where it left off
✅ Remaining 50 emails will be sent
```

### Scenario 2: Scheduled Campaign (Future)
```
Before Restart:
- Status: "scheduled"
- Start: Tomorrow 9:00 AM

After Restart:
✅ Rescheduled for tomorrow 9:00 AM
✅ Will execute at correct time
```

### Scenario 3: Scheduled Campaign (Overdue)
```
Before Restart:
- Status: "scheduled"
- Start: 2 hours ago

After Restart:
✅ Starts immediately
✅ Marked as overdue but executes
```

### Scenario 4: Recurring Campaign
```
Before Restart:
- Status: "scheduled"
- Frequency: Daily
- Last executed: Yesterday

After Restart:
✅ Calculates next execution
✅ Reschedules accordingly
✅ Continues recurring pattern
```

## 🛠️ Manual Recovery

If automatic recovery fails, use the manual endpoint:

```bash
# POST to recovery endpoint
curl -X POST http://localhost:3000/api/campaigns/recover \
  -H "Cookie: your-session-cookie"

# Response:
{
  "success": true,
  "recovered": 3,
  "skipped": 1,
  "details": {
    "recovered": [
      { "id": "...", "name": "Campaign 1", "status": "processing" }
    ],
    "skipped": [
      { "id": "...", "name": "Campaign 2", "reason": "Job already exists" }
    ]
  }
}
```

## 📊 Monitoring

### Check Console Logs:
```
✅ Agenda initialized successfully
🔄 Checking for pending campaigns to resume...
📋 Found 2 pending campaign(s)
▶️ Resuming campaign "Black Friday Sale" immediately
⏰ Rescheduling campaign "Weekly Newsletter" for 11/20/2025, 9:00 AM
✅ Campaign "Black Friday Sale" resumed successfully
✅ Campaign "Weekly Newsletter" resumed successfully
✅ All pending campaigns processed
```

### Check MongoDB:
```javascript
// Agenda jobs collection
db.agendaJobs.find({
  name: { $in: ["process-bulk-campaign", "process-recurring-campaign"] }
}).pretty()

// Campaign status
db.campaigns.find({
  status: { $in: ["scheduled", "processing"] }
}).pretty()
```

## ⚠️ Important Notes

1. **MongoDB Connection Required**
   - Agenda stores jobs in MongoDB
   - Jobs persist across restarts
   - Connection must be stable

2. **Job Locking**
   - Agenda uses locks to prevent duplicate execution
   - Lock lifetime: 10 minutes (configurable)
   - Multiple servers can share same MongoDB

3. **Graceful Shutdown**
   - SIGTERM/SIGINT handlers registered
   - Jobs complete before shutdown
   - No data loss

4. **Coolify Deployment**
   - Auto-recovery works in containers
   - Survives container restarts
   - No manual intervention needed

## 🧪 Testing Recovery

### Test 1: Create and Restart
```bash
# 1. Create a scheduled campaign
# 2. Restart server: npm run dev
# 3. Check logs for recovery messages
# 4. Verify campaign still scheduled
```

### Test 2: Interrupt Processing
```bash
# 1. Start a campaign
# 2. Kill server mid-execution
# 3. Restart server
# 4. Campaign should resume
```

### Test 3: Overdue Campaign
```bash
# 1. Create campaign scheduled 1 hour ago
# 2. Restart server
# 3. Should start immediately
```

## 🎯 Best Practices

1. **Always use graceful shutdown** (Ctrl+C, not kill -9)
2. **Monitor logs** for recovery messages
3. **Check MongoDB** if campaigns don't resume
4. **Use manual recovery** endpoint if needed
5. **Keep MongoDB connection stable**

## 🔧 Troubleshooting

### Campaign not resuming?
1. Check MongoDB connection
2. Verify campaign status in DB
3. Check Agenda jobs collection
4. Use manual recovery endpoint
5. Check server logs for errors

### Duplicate executions?
1. Check for multiple server instances
2. Verify Agenda locking is working
3. Check agendaJobId in campaign

### Jobs not executing?
1. Verify Agenda is started
2. Check job definitions are loaded
3. Verify MongoDB connection
4. Check processEvery setting (10 seconds)
