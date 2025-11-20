/**
 * Send execution report email to development team
 */
export async function sendExecutionReport(data: {
  campaign: any;
  executionStartTime: Date;
  executionEndTime: Date;
  executionDuration: number;
  totalSent: number;
  totalFailed: number;
  smtpStats: Array<{
    serverId: string;
    serverName: string;
    sent: number;
    failed: number;
  }>;
  remainingCount: number;
}) {
  const {
    campaign,
    executionStartTime,
    executionEndTime,
    executionDuration,
    totalSent,
    totalFailed,
    smtpStats,
    remainingCount,
  } = data;

  const reportEmail = process.env.REPORT_EMAIL || "development@agondigital.in";
  const fromEmail = process.env.SMTP_FROM || "noreply@yourdomain.com";

  // Format duration
  const hours = Math.floor(executionDuration / 3600);
  const minutes = Math.floor((executionDuration % 3600) / 60);
  const seconds = executionDuration % 60;
  const durationFormatted = `${hours}h ${minutes}m ${seconds}s`;

  // Build SMTP stats table
  const smtpStatsRows = smtpStats
    .map(
      (stat) => `
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">${stat.serverName}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; font-family: monospace;">${stat.serverId}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #10b981; font-weight: bold;">${stat.sent}</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #ef4444; font-weight: bold;">${stat.failed}</td>
    </tr>
  `,
    )
    .join("");

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">📊 Campaign Execution Report</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Execution completed successfully</p>
    </div>

    <!-- Main Content -->
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      
      <!-- Campaign Info -->
      <div style="margin-bottom: 30px; padding: 20px; background: #f9fafb; border-radius: 8px; border-left: 4px solid #667eea;">
        <h2 style="margin: 0 0 15px 0; color: #1f2937; font-size: 20px;">Campaign Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #6b7280; width: 180px;"><strong>Campaign Name:</strong></td>
            <td style="padding: 8px 0; color: #1f2937;">${campaign?.name || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Campaign ID:</strong></td>
            <td style="padding: 8px 0; color: #1f2937; font-family: monospace;">${campaign?._id || "N/A"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Description:</strong></td>
            <td style="padding: 8px 0; color: #1f2937;">${campaign?.description || "No description"}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #6b7280;"><strong>Delay:</strong></td>
            <td style="padding: 8px 0; color: #1f2937;">${campaign?.delay || 0} seconds between emails</td>
          </tr>
        </table>
      </div>

      <!-- Execution Summary -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">⏱️ Execution Summary</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="padding: 20px; background: #ecfdf5; border-radius: 8px; border: 1px solid #d1fae5;">
            <div style="color: #065f46; font-size: 14px; margin-bottom: 5px;">Start Time</div>
            <div style="color: #047857; font-size: 18px; font-weight: bold;">${executionStartTime.toLocaleString()}</div>
          </div>
          <div style="padding: 20px; background: #fef3c7; border-radius: 8px; border: 1px solid #fde68a;">
            <div style="color: #92400e; font-size: 14px; margin-bottom: 5px;">End Time</div>
            <div style="color: #b45309; font-size: 18px; font-weight: bold;">${executionEndTime.toLocaleString()}</div>
          </div>
          <div style="padding: 20px; background: #dbeafe; border-radius: 8px; border: 1px solid #bfdbfe;">
            <div style="color: #1e40af; font-size: 14px; margin-bottom: 5px;">Duration</div>
            <div style="color: #1d4ed8; font-size: 18px; font-weight: bold;">${durationFormatted}</div>
          </div>
          <div style="padding: 20px; background: #f3e8ff; border-radius: 8px; border: 1px solid #e9d5ff;">
            <div style="color: #6b21a8; font-size: 14px; margin-bottom: 5px;">Total Duration (seconds)</div>
            <div style="color: #7c3aed; font-size: 18px; font-weight: bold;">${executionDuration}s</div>
          </div>
        </div>
      </div>

      <!-- Email Statistics -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">📧 Email Statistics</h2>
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="padding: 20px; background: #dcfce7; border-radius: 8px; border: 2px solid #86efac;">
            <div style="color: #166534; font-size: 14px; margin-bottom: 5px;">✅ Successfully Sent</div>
            <div style="color: #15803d; font-size: 32px; font-weight: bold;">${totalSent}</div>
          </div>
          <div style="padding: 20px; background: #fee2e2; border-radius: 8px; border: 2px solid #fca5a5;">
            <div style="color: #991b1b; font-size: 14px; margin-bottom: 5px;">❌ Failed</div>
            <div style="color: #dc2626; font-size: 32px; font-weight: bold;">${totalFailed}</div>
          </div>
          <div style="padding: 20px; background: #e0e7ff; border-radius: 8px; border: 2px solid #a5b4fc;">
            <div style="color: #3730a3; font-size: 14px; margin-bottom: 5px;">📊 Total in Campaign</div>
            <div style="color: #4338ca; font-size: 32px; font-weight: bold;">${campaign?.totalRecipients || 0}</div>
          </div>
          <div style="padding: 20px; background: #fef9c3; border-radius: 8px; border: 2px solid #fde047;">
            <div style="color: #854d0e; font-size: 14px; margin-bottom: 5px;">⏳ Remaining</div>
            <div style="color: #a16207; font-size: 32px; font-weight: bold;">${remainingCount}</div>
          </div>
        </div>
      </div>

      <!-- SMTP Server Stats -->
      <div style="margin-bottom: 30px;">
        <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px;">🖥️ SMTP Server Statistics</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-weight: 600;">Server Name</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: left; color: #374151; font-weight: 600;">Server ID</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: 600;">Sent</th>
                <th style="padding: 12px; border: 1px solid #e5e7eb; text-align: center; color: #374151; font-weight: 600;">Failed</th>
              </tr>
            </thead>
            <tbody>
              ${smtpStatsRows}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Campaign Progress -->
      <div style="margin-bottom: 20px; padding: 20px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
        <h3 style="margin: 0 0 15px 0; color: #166534; font-size: 18px;">📈 Campaign Progress</h3>
        <div style="background: #dcfce7; height: 30px; border-radius: 15px; overflow: hidden; position: relative;">
          <div style="background: linear-gradient(90deg, #10b981 0%, #059669 100%); height: 100%; width: ${campaign?.totalRecipients ? ((campaign.sentCount || 0) / campaign.totalRecipients) * 100 : 0}%; transition: width 0.3s ease;"></div>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #166534; font-weight: bold; font-size: 14px;">
            ${campaign?.totalRecipients ? Math.round(((campaign.sentCount || 0) / campaign.totalRecipients) * 100) : 0}% Complete
          </div>
        </div>
        <div style="margin-top: 10px; text-align: center; color: #166534; font-size: 14px;">
          ${campaign?.sentCount || 0} of ${campaign?.totalRecipients || 0} emails sent
        </div>
      </div>

      <!-- Footer -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 14px;">
        <p style="margin: 0;">This is an automated report from your Email Campaign System</p>
        <p style="margin: 10px 0 0 0;">Generated at ${new Date().toLocaleString()}</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    // Get first available SMTP server from env
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      console.warn(
        "SMTP credentials not configured in env, skipping report email",
      );
      return;
    }

    // Send using nodemailer directly (bypass our sendEmail service to avoid tracking)
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: fromEmail,
      to: reportEmail,
      subject: `📊 Campaign Execution Report: ${campaign?.name || "Unknown"} - ${totalSent} sent, ${totalFailed} failed`,
      html: htmlContent,
    });

    console.log(`Execution report sent to ${reportEmail}`);
  } catch (error) {
    console.error("Failed to send execution report:", error);
    // Don't throw - report email failure shouldn't fail the campaign
  }
}
