import { type NextRequest, NextResponse } from "next/server";
import { unsubscribeRecipient } from "@/services/recipient.service";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const recipientId = searchParams.get("recipientId");
		const token = searchParams.get("token");

		// Validate input
		if (!recipientId || !token) {
			return new NextResponse(
				`
<!DOCTYPE html>
<html>
<head>
    <title>Unsubscribe Error</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <h1 class="error">Invalid Unsubscribe Link</h1>
    <p>The unsubscribe link is invalid or has expired.</p>
</body>
</html>
				`,
				{
					status: 400,
					headers: { "Content-Type": "text/html" },
				},
			);
		}

		// Unsubscribe recipient
		const result = await unsubscribeRecipient(recipientId, token);

		return new NextResponse(
			`
<!DOCTYPE html>
<html>
<head>
    <title>Unsubscribed Successfully</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .success { color: #16a34a; }
        .email { background: #f3f4f6; padding: 10px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <h1 class="success">✓ Unsubscribed Successfully</h1>
    <p>You have been unsubscribed from our mailing list.</p>
    <div class="email">${result.email}</div>
    <p>You will no longer receive emails from us.</p>
</body>
</html>
			`,
			{
				status: 200,
				headers: { "Content-Type": "text/html" },
			},
		);
	} catch (error) {
		console.error("Error unsubscribing recipient:", error);

		return new NextResponse(
			`
<!DOCTYPE html>
<html>
<head>
    <title>Unsubscribe Error</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
        .error { color: #dc2626; }
    </style>
</head>
<body>
    <h1 class="error">Unsubscribe Failed</h1>
    <p>${error instanceof Error ? error.message : "An error occurred while unsubscribing."}</p>
</body>
</html>
			`,
			{
				status: 500,
				headers: { "Content-Type": "text/html" },
			},
		);
	}
}
