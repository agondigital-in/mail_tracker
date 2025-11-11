# Bulk Email Compose Guide

## Overview
Send personalized emails to multiple recipients by uploading an Excel file.

## Excel Format

Your Excel file should have exactly 2 columns:

| Name | Email |
|------|-------|
| John Doe | john@example.com |
| Jane Smith | jane@example.com |
| Bob Wilson | bob@example.com |

### Column Requirements:
- **Name**: Recipient's name (used for personalization)
- **Email**: Valid email address

## Personalization

Use `{{name}}` in your subject and body to personalize emails:

### Example Subject:
```
Hello {{name}}, Special Offer Just for You!
```

### Example Body:
```
Hi {{name}},

We have a special offer tailored just for you!

Best regards,
Team
```

### Result:
For John Doe:
- Subject: "Hello John Doe, Special Offer Just for You!"
- Body: "Hi John Doe, We have a special offer..."

## Features

✅ Upload Excel (.xlsx, .xls)
✅ Automatic email validation
✅ Campaign selection or creation
✅ Personalization with {{name}}
✅ Bulk sending with progress tracking
✅ Success/failure reporting

## Usage Steps

1. **Prepare Excel File**
   - Create Excel with Name and Email columns
   - Add all recipients

2. **Upload File**
   - Click upload area
   - Select your Excel file
   - System will validate and show recipient count

3. **Select/Create Campaign**
   - Choose existing campaign from dropdown
   - Or click + to create new campaign

4. **Compose Email**
   - Write subject (use {{name}} for personalization)
   - Write body (use {{name}} for personalization)

5. **Send**
   - Click "Send to X Recipients"
   - Wait for completion
   - Check success/failure report

## Tips

💡 Test with a small list first
💡 Use {{name}} for better engagement
💡 Keep subject lines under 50 characters
💡 Ensure all emails are valid before uploading
💡 Create campaigns to organize your bulk sends

## Access

Navigate to: **Dashboard → Bulk Compose**
