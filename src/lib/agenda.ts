import Agenda from "agenda";

const mongoConnectionString = process.env.DATABASE_URL || "";

if (!mongoConnectionString) {
  throw new Error("DATABASE_URL environment variable is required for Agenda");
}

// Create Agenda instance
const agenda = new Agenda({
  db: {
    address: mongoConnectionString,
    collection: process.env.AGENDA_COLLECTION || "agendaJobs",
  },
  processEvery: "10 seconds",
  maxConcurrency: 5,
  defaultConcurrency: 2,
  lockLimit: 10,
  defaultLockLimit: 5,
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
});

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log("Gracefully shutting down Agenda...");
  await agenda.stop();
  console.log("Agenda stopped successfully");
  process.exit(0);
};

// Register shutdown handlers
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Start Agenda when this module is imported
let isStarted = false;

export const startAgenda = async () => {
  if (isStarted) {
    return agenda;
  }

  try {
    await agenda.start();
    isStarted = true;
    console.log("Agenda started successfully");
  } catch (error) {
    console.error("Failed to start Agenda:", error);
    throw error;
  }

  return agenda;
};

export default agenda;
