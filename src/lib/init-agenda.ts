import { startAgenda } from "./agenda";
import { defineAgendaJobs } from "@/services/campaign-job-processor.service";

/**
 * Initialize Agenda and define all jobs
 * Call this once when the application starts
 */
export async function initializeAgenda() {
	try {
		// Define all job handlers
		defineAgendaJobs();

		// Start Agenda
		await startAgenda();

		console.log("Agenda initialized successfully");
	} catch (error) {
		console.error("Failed to initialize Agenda:", error);
		throw error;
	}
}
