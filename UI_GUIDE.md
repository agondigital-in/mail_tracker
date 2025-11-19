# Next Execution Time - UI Guide

## 📍 Where it appears:

### 1. Campaign List Page (`/dashboard/campaigns`)

```
┌─────────────────────────────────────────┐
│  Campaign Name              [scheduled] │
│  Description text here...               │
│                                         │
│  Sent: 50  Total: 100                  │
│                                         │
│  🔄 Daily                               │  ← Recurring indicator
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 🕐 Next Execution                 │ │  ← BLUE BOX
│  │ Next Execution                    │ │
│  │ Jan 20, 2024, 9:00:00 AM         │ │
│  └───────────────────────────────────┘ │
│                                         │
│  📅 Created: Jan 15, 2024              │
│                                         │
│  [View]  [Monitor]                     │
└─────────────────────────────────────────┘
```

### 2. Monitor Page (`/dashboard/campaigns/[id]/monitor`)

```
Campaign Name                    [processing] 🔄 Daily

┌─────────────────────────────────────────────┐
│ 🕐 Next Execution                           │  ← HIGHLIGHTED CARD
│                                             │
│ 📅 Jan 20, 2024, 9:00:00 AM                │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Campaign Progress      [Pause] [Cancel]     │
│                                             │
│ Overall Progress                            │
│ ████████░░░░░░░░░░  50 / 100               │
│ 50.0% complete                              │
│                                             │
│ [Total: 100] [Sent: 50] [Remaining: 50]    │
└─────────────────────────────────────────────┘
```

## ✅ When Next Execution Shows:

### Scheduled Campaign:
- Schedule Type: `scheduled`
- Start Date: Future date
- Shows: Exact scheduled date/time

### Recurring Campaign (After First Run):
- Schedule Type: `recurring`
- Frequency: `daily` / `weekly` / `monthly`
- Last Executed: Has timestamp
- Shows: Calculated next execution based on frequency

### Example Calculation:
```javascript
Last Executed: Jan 19, 2024, 9:00 AM
Frequency: daily
Next Execution: Jan 20, 2024, 9:00 AM  ← Shows this

Last Executed: Jan 13, 2024, 9:00 AM
Frequency: weekly
Next Execution: Jan 20, 2024, 9:00 AM  ← Shows this
```

## ❌ When Next Execution DOESN'T Show:

1. **Immediate campaigns** - No schedule
2. **Completed campaigns** - Already finished
3. **Scheduled campaigns (past date)** - Already executed
4. **Recurring campaigns (no lastExecutedAt)** - Not started yet

## 🎨 Visual Indicators:

- **Blue box** = Next execution info
- **Purple badge** = Recurring campaign
- **Status badges**:
  - Green = completed
  - Blue = processing
  - Purple = scheduled
  - Yellow = paused
  - Red = failed
  - Gray = cancelled

## 🧪 Test It:

1. Create a campaign at `/dashboard/bulk-compose`
2. Select "Scheduled" or "Recurring"
3. Set future date/time
4. Go to `/dashboard/campaigns`
5. See the blue "Next Execution" box
6. Click "Monitor" to see it on monitor page too
