# 🚀 Quick Test Guide

Your email tracking system is now configured and ready to test!

## ✅ SMTP Configured
- **Host**: smtp.gmail.com
- **Port**: 587
- **Email**: its.memeland@gmail.com
- **Status**: ✅ Ready

## 🧪 Test Steps

### 1. Start MongoDB
```bash
mongod
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access Application
Open: http://localhost:3000

### 4. Create Account
1. Click "Sign Up"
2. Enter email and password
3. Sign up

### 5. Send Test Email
1. Go to Dashboard
2. Click "Compose Email"
3. Fill in:
   - **To**: your-test-email@gmail.com (or any email you can access)
   - **Subject**: Test Email Tracking
   - **Content**: 
   ```html
   <h1>Hello!</h1>
   <p>This is a test email with tracking.</p>
   <p><a href="https://google.com">Click here to test link tracking</a></p>
   ```
4. Click "Send Email"

### 6. Test Open Tracking
1. Open the email in your email client (Gmail, Outlook, etc.)
2. Go back to the dashboard
3. You should see:
   - ✅ 1 open event recorded
   - ✅ Timestamp of when you opened it
   - ✅ Your IP address and user agent

### 7. Test Click Tracking
1. Click the link in the email
2. You'll be redirected to Google
3. Go to the email detail page
4. You should see:
   - ✅ 1 click event recorded
   - ✅ Destination URL (https://google.com)
   - ✅ Timestamp of the click

### 8. View Analytics
1. Go to Dashboard
2. Check the stats cards:
   - Total Sent: 1
   - Opens: 1
   - Clicks: 1
   - Open Rate: 100%
3. View the interactive chart
4. Try different time ranges (7d/30d/90d)

## 🎯 What to Test

### ✅ Email Sending
- [ ] Send email to yourself
- [ ] Check email arrives in inbox
- [ ] Verify tracking pixel is embedded
- [ ] Verify links are converted to tracking URLs

### ✅ Open Tracking
- [ ] Open email in Gmail
- [ ] Check dashboard shows open event
- [ ] Verify Gmail proxy detection (if using Gmail)
- [ ] Check IP address is recorded
- [ ] Check user agent is recorded

### ✅ Click Tracking
- [ ] Click link in email
- [ ] Verify redirect works
- [ ] Check dashboard shows click event
- [ ] Verify destination URL is correct
- [ ] Check timestamp is accurate

### ✅ Campaign Management
- [ ] Create a campaign
- [ ] Send email with campaign
- [ ] View campaign details
- [ ] Check campaign statistics

### ✅ Analytics
- [ ] View dashboard stats
- [ ] Check open rate calculation
- [ ] Check click rate calculation
- [ ] View timeline chart
- [ ] Test time range selector

## 🐛 Troubleshooting

### Email Not Sending
**Error**: "Failed to send email"
**Solution**: 
- Check SMTP credentials in `.env`
- Make sure you're using the App Password, not your regular Gmail password
- Verify 2FA is enabled on your Gmail account

### Tracking Not Working
**Error**: Opens/clicks not showing
**Solution**:
- Check MongoDB is running
- Verify tracking pixel is in email HTML
- Check browser console for errors
- Make sure BETTER_AUTH_URL is correct

### Can't Access Dashboard
**Error**: Redirected to login
**Solution**:
- Make sure you're logged in
- Check Better Auth is configured
- Clear browser cookies and try again

## 📊 Expected Results

After sending 1 test email and opening it:

### Dashboard Stats
```
Total Sent: 1
Opens: 1 (100% open rate)
Clicks: 1 (100% click rate)
Bounces: 0 (0% bounce rate)
```

### Email Detail Page
```
✅ Email sent to: your-test-email@gmail.com
✅ Subject: Test Email Tracking
✅ Sent at: [timestamp]
✅ First opened: [timestamp]
✅ First clicked: [timestamp]

Open Events (1):
- [timestamp] - [Your IP] - [Your browser]
  [Gmail Proxy badge if using Gmail]

Click Events (1):
- [timestamp] - https://google.com
  [Your IP] - [Your browser]
```

### Timeline Chart
```
Interactive area chart showing:
- Blue area: Opens over time
- Green area: Clicks over time
- Time range selector: 7d / 30d / 90d
```

## 🎉 Success Criteria

Your system is working correctly if:
- ✅ Email sends successfully
- ✅ Email arrives in inbox
- ✅ Opening email creates open event
- ✅ Clicking link creates click event
- ✅ Dashboard shows correct statistics
- ✅ Chart displays timeline data
- ✅ Campaign management works
- ✅ All pages load without errors

## 🚀 Next Steps

Once testing is complete:
1. ✅ Send more test emails
2. ✅ Create multiple campaigns
3. ✅ Test with different email clients
4. ✅ Monitor analytics over time
5. 🚀 Deploy to production!

## 📝 Notes

- Gmail may prefetch images (marked as "Gmail Proxy")
- Click tracking is more reliable than open tracking
- First open/click are highlighted in the UI
- All timestamps are in your local timezone

---

**Happy Testing!** 📧📊

Your email tracking system is ready to use with:
- ✅ SMTP configured
- ✅ Beautiful shadcn charts
- ✅ Real-time tracking
- ✅ Campaign management
- ✅ Comprehensive analytics

Start tracking your email engagement now! 🎉
