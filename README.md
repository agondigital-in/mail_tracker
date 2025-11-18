# Email Tracking & Analytics System

A full-featured email tracking and analytics system built with Next.js, similar to SendGrid/Mailgun tracking capabilities.

## Features

- 📧 Email sending with SMTP integration
- 📊 Open tracking via 1×1 pixel (with Gmail proxy detection)
- 🔗 Click tracking via redirect URLs
- 📉 Bounce handling via webhooks
- 📈 Campaign management and analytics
- 📊 Interactive charts with shadcn/ui
- 🔐 Secure authentication with Better Auth
- 💾 MongoDB database with Mongoose
- 🎨 Beautiful UI with shadcn components

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Better Auth Configuration
BETTER_AUTH_SECRET=your-secret-key
BETTER_AUTH_URL=http://localhost:3000
CORS_ORIGIN=http://localhost:3000

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/mail
DATABASE_NAME=mail

# SMTP Configuration (Required for sending emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=YourApp <your-email@gmail.com>

# Webhook Configuration (Optional - for bounce handling)
WEBHOOK_SECRET=your-webhook-secret-key

# Agenda Job Queue Configuration (for bulk campaigns)
AGENDA_COLLECTION=agendaJobs
MAX_CAMPAIGN_SIZE=50000
MAX_FILE_SIZE_MB=10
UNSUBSCRIBE_SECRET=your-unsubscribe-secret-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

### SMTP Setup

For Gmail:
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `SMTP_PASSWORD`

For other providers:
- **SendGrid**: Use `smtp.sendgrid.net` with API key
- **Mailgun**: Use `smtp.mailgun.org` with credentials
- **Amazon SES**: Use your region's SMTP endpoint

## Installation

```bash
# Install dependencies
npm install

# Start MongoDB (if running locally)
mongod

# Run development server
npm run dev
```

## API Endpoints

### Email Management
- `POST /api/emails/send` - Send tracked email
- `GET /api/emails/list` - List user's emails
- `GET /api/emails/[id]` - Get email details with events

### Tracking (Public)
- `GET /api/track/open?id={trackingId}` - Track email opens
- `GET /api/track/click?id={trackingId}&url={destination}` - Track link clicks

### Campaigns
- `POST /api/campaigns/create` - Create campaign
- `GET /api/campaigns/list` - List user's campaigns
- `GET /api/campaigns/[id]` - Get campaign details with stats

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard statistics

### Webhooks
- `POST /api/webhooks/bounce` - Handle bounce notifications

## Database Models

- **Email** - Email records with tracking data
- **OpenEvent** - Email open events
- **ClickEvent** - Link click events
- **BounceEvent** - Email bounce events
- **Campaign** - Campaign organization
- **User** - User accounts (Better Auth)

## Development

```bash
# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm start
```

## Architecture

- **Frontend**: Next.js 16 with React 19
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **Authentication**: Better Auth
- **Email**: Nodemailer with SMTP
- **UI**: shadcn components with Tailwind CSS

## License

MIT
