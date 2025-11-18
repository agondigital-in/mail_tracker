import { NextResponse } from "next/server";
import { initializeAgenda } from "@/lib/init-agenda";

let isInitialized = false;

// Initialize Agenda when this route is first accessed
if (!isInitialized) {
	initializeAgenda()
		.then(() => {
			isInitialized = true;
		})
		.catch((error) => {
			console.error("Failed to initialize Agenda:", error);
		});
}

export async function GET() {
	return NextResponse.json({
		success: true,
		message: "Agenda initialization triggered",
		initialized: isInitialized,
	});
}
