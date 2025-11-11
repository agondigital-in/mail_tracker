import { NextRequest, NextResponse } from "next/server";
import { logOpenEvent } from "@/services/tracking.service";

// 1x1 transparent GIF in base64
const TRACKING_PIXEL = Buffer.from(
	"R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==",
	"base64",
);

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const trackingId = searchParams.get("id");

		if (!trackingId) {
			// Still return pixel even if no tracking ID
			return new NextResponse(TRACKING_PIXEL, {
				status: 200,
				headers: {
					"Content-Type": "image/gif",
					"Cache-Control": "no-cache, no-store, must-revalidate",
					Pragma: "no-cache",
					Expires: "0",
				},
			});
		}

		// Extract metadata from request
		const ipAddress =
			request.headers.get("x-forwarded-for")?.split(",")[0] ||
			request.headers.get("x-real-ip") ||
			"unknown";
		const userAgent = request.headers.get("user-agent") || "unknown";

		// Log open event asynchronously (don't await)
		logOpenEvent(trackingId, {
			ipAddress,
			userAgent,
			timestamp: new Date(),
		}).catch((error) => {
			console.error("Error logging open event:", error);
		});

		// Return pixel immediately
		return new NextResponse(TRACKING_PIXEL, {
			status: 200,
			headers: {
				"Content-Type": "image/gif",
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	} catch (error) {
		console.error("Error in open tracking endpoint:", error);

		// Always return pixel even on error
		return new NextResponse(TRACKING_PIXEL, {
			status: 200,
			headers: {
				"Content-Type": "image/gif",
				"Cache-Control": "no-cache, no-store, must-revalidate",
				Pragma: "no-cache",
				Expires: "0",
			},
		});
	}
}
