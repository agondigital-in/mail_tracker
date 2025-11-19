# Deployment Guide - Coolify v4

## 🚀 Quick Deploy (Single Container - Recommended)

### 1. Environment Variables (Coolify Dashboard)
```env
DATABASE_URL=mongodb://username:password@host:27017/dbname
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=https://yourdomain.com
NODE_ENV=production
```

### 2. Coolify Settings
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`
- **Dockerfile**: Auto-detected

### 3. Deploy
Push to your git repository, Coolify will auto-deploy.

---

## ✅ What's Included

- ✅ Agenda background jobs (auto-initialized)
- ✅ Email sending with SMTP
- ✅ Campaign management
- ✅ Bulk email sending
- ✅ Scheduled & recurring campaigns

---

## 🔧 Advanced: Separate Worker (Optional)

**Only use if you need:**
- High volume email sending (1000+/min)
- Separate scaling for API and workers

### Setup Multi-Container in Coolify:

#### Container 1: Next.js App
- **Build Command**: `npm run build`
- **Start Command**: `npm start`
- **Port**: `3000`

#### Container 2: Agenda Worker
- **Build Command**: `npm run build`
- **Start Command**: `npm run worker`
- **Port**: None (background process)

Both containers should share the same `DATABASE_URL`.

---

## 📊 Monitoring

Check Agenda jobs in MongoDB:
```javascript
// Collection: agendaJobs
db.agendaJobs.find({ name: "process-bulk-campaign" })
```

Check logs in Coolify dashboard for:
```
✅ Agenda initialized successfully
```

---

## 🐛 Troubleshooting

### Emails not sending?
1. Check Coolify logs for Agenda initialization
2. Verify `DATABASE_URL` is correct
3. Check SMTP server configuration in app
4. Look for MongoDB connection errors

### MongoDB connection issues?
- Ensure MongoDB is accessible from Coolify
- Check firewall rules
- Verify connection string format

---

## 📝 Notes

- Agenda auto-initializes when server starts
- Jobs persist in MongoDB (survive restarts)
- **Auto-recovery**: Pending campaigns automatically resume after restart
- No need for separate worker in most cases
- Use `worker.js` only for high-volume scenarios

## 🔄 Campaign Recovery After Restart

The system automatically:
1. ✅ Checks for pending campaigns on startup
2. ✅ Resumes "processing" campaigns immediately
3. ✅ Reschedules "scheduled" campaigns
4. ✅ Handles overdue campaigns (starts immediately)

### Manual Recovery (if needed):
```bash
# Call recovery endpoint
curl -X POST http://localhost:3000/api/campaigns/recover \
  -H "Cookie: your-session-cookie"
```

### Check Agenda Jobs in MongoDB:
```javascript
// In MongoDB shell
db.agendaJobs.find({ name: "process-bulk-campaign" })
db.agendaJobs.find({ name: "process-recurring-campaign" })
```
