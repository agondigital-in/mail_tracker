import nodemailer from "nodemailer";

async function createEtherealAccount() {
	try {
		console.log("Creating Ethereal test account...");
		const testAccount = await nodemailer.createTestAccount();

		console.log("\n✅ Ethereal Account Created Successfully!\n");
		console.log("📧 SMTP Configuration:");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`Host:     ${testAccount.smtp.host}`);
		console.log(`Port:     ${testAccount.smtp.port}`);
		console.log(`User:     ${testAccount.user}`);
		console.log(`Password: ${testAccount.pass}`);
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

		console.log("📝 Add these to your .env file:\n");
		console.log(`SMTP_HOST=${testAccount.smtp.host}`);
		console.log(`SMTP_PORT=${testAccount.smtp.port}`);
		console.log(`SMTP_USER=${testAccount.user}`);
		console.log(`SMTP_PASSWORD=${testAccount.pass}`);
		console.log(`SMTP_FROM=Email Tracker <${testAccount.user}>\n`);

		console.log("🌐 View sent emails at:");
		console.log(`https://ethereal.email/login`);
		console.log(`Username: ${testAccount.user}`);
		console.log(`Password: ${testAccount.pass}\n`);

		console.log("✨ All test emails will be visible in the Ethereal inbox!");
	} catch (error) {
		console.error("❌ Error creating Ethereal account:", error);
	}
}

createEtherealAccount();
