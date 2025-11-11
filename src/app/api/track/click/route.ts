import { NextRequest, NextResponse } from "next/server";
import { logClickEvent } from "@/services/tracking.service";

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const trackingId = searchParams.get("id");
		const destinationUrl = searchParams.get("url");

		// If no destination URL, redirect to home
		if (!destinationUrl) {
			return NextResponse.redirect(
				process.env.BETTER_AUTH_URL || "http://localhost:3000",
			);
		}

		// If tracking ID is provided, log the click
		if (trackingId) {
			// Extract metadata from request
			const ipAddress =
				request.headers.get("x-forwarded-for")?.split(",")[0] ||
				request.headers.get("x-real-ip") ||
				"unknown";
			const userAgent = request.headers.get("user-agent") || "unknown";

			// Log click event asynchronously (don't await)
			logClickEvent(trackingId, destinationUrl, {
				ipAddress,
				userAgent,
				timestamp: new Date(),
			}).catch((error) => {
				console.error("Error logging click event:", error);
			});
		}

		// Redirect to destination URL immediately
		return NextResponse.redirect(destinationUrl);
	} catch (error) {
		console.error("Error in click tracking endpoint:", error);

		// Still redirect to destination URL on error
		const { searchParams } = new URL(request.url);
		const destinationUrl = searchParams.get("url");

		if (destinationUrl) {
			return NextResponse.redirect(destinationUrl);
		}

		// Fallback to home
		return NextResponse.redirect(
			process.env.BETTER_AUTH_URL || "http://localhost:3000",
		);
	}
}
