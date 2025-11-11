# 🚀 Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- MongoDB installed and running
- Gmail account (or other SMTP provider)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure SMTP (Gmail Example)

#### Get Gmail App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Enable 2-factor authentication if not already enabled
3. Generate an "App Password" for "Mail"
4. Copy the 16-character password

#### Update `.env` file:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=YourApp <your-email@gmail.com>
```

### 3. Start MongoDB

**Windows:**
```bash
mongod
```

**Mac/Linux:**
```bash
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### 4. Run Development Server

```bash
npm run dev
```

### 5. Access Application

Open http://localhost:3000 in your browser

## First Steps

### 1. Create Account
- Click "Sign Up" on the home page
- Enter your email and password
- Click "Sign Up"

### 2. Send Your First Email
- Click "Compose Email" in the dashboard
- Fill in:
  - Recipient email
  - Subject
  - HTML content (e.g., `<p>Hello World!</p>`)
  - Optional: Select or create a campaign
- Click "Send Email"

### 3. Track Engagement
- The email will be sent with tracking enabled
- When the recipient opens the email, you'll see it in the dashboard
- When they click links, you'll see click events
- View detailed tracking data on the email detail page

## Testing Tracking

### Test Open Tracking:
1. Send an email to yourself
2. Open the email in your email client
3. Check the dashboard - you should see an open event

### Test Click Tracking:
1. Send an email with a link: `<a href="https://google.com">Click here</a>`
2. Click the link in the email
3. Check the email detail page - you should see a click event

## Common Issues

### SMTP Connection Failed
- **Issue**: "Failed to send email. Please check SMTP configuration."
- **Solution**: 
  - Verify SMTP credentials in `.env`
  - Make sure 2FA is enabled on Gmail
  - Use App Password, not your regular password
  - Check if port 587 is not blocked by firewall

### MongoDB Connection Failed
- **Issue**: "Error connecting to database"
- **Solution**:
  - Make sure MongoDB is running: `mongod`
  - Check DATABASE_URL in `.env`
  - Default: `mongodb://localhost:27017/mail`

### Authentication Not Working
- **Issue**: Can't log in or sign up
- **Solution**:
  - Check BETTER_AUTH_SECRET is set in `.env`
  - Make sure MongoDB is running
  - Clear browser cookies and try again

### Tracking Not Working
- **Issue**: Opens/clicks not being recorded
- **Solution**:
  - Check that tracking pixel is in the email HTML
  - Make sure BETTER_AUTH_URL is set correctly
  - Check browser console for errors
  - Verify MongoDB is running

## Alternative SMTP Providers

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=YourApp <verified-sender@yourdomain.com>
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASSWORD=your-mailgun-password
SMTP_FROM=YourApp <noreply@your-domain.mailgun.org>
```

### Amazon SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=YourApp <verified@yourdomain.com>
```

## Production Deployment

### Environment Variables
Set these in your production environment:
- `DATABASE_URL` - MongoDB connection string (use MongoDB Atlas)
- `DATABASE_NAME` - Database name
- `BETTER_AUTH_SECRET` - Random secret key
- `BETTER_AUTH_URL` - Your production URL
- `CORS_ORIGIN` - Your production URL
- `SMTP_HOST` - SMTP server
- `SMTP_PORT` - SMTP port
- `SMTP_USER` - SMTP username
- `SMTP_PASSWORD` - SMTP password
- `SMTP_FROM` - From email address
- `WEBHOOK_SECRET` - Secret for bounce webhooks

### Recommended Services
- **Hosting**: Vercel, Railway, or Render
- **Database**: MongoDB Atlas (free tier available)
- **Email**: SendGrid, Mailgun, or Amazon SES

## Need Help?

Check the following files:
- `README.md` - Full documentation
- `PROJECT_COMPLETE.md` - Feature overview
- `.env` - Environment configuration

## Next Steps

1. ✅ Set up SMTP credentials
2. ✅ Send test email
3. ✅ Create campaigns
4. ✅ Monitor analytics
5. 🚀 Deploy to production

Happy tracking! 📧📊
