#!/usr/bin/env bun
import { getDB, migrateDB, getRepos } from "@ai-starter/db";
import { CoreAppService } from "@ai-starter/app";
import { processNextJob } from "./processor";

// Parse command line arguments
const watchMode = process.argv.includes("--watch");
const pollInterval = 1000; // 1 second

async function main() {
  // Initialize database and services
  const db = getDB(process.env.DATABASE_URL || "file:./dev.db");
  await migrateDB(db);
  const repos = getRepos(db);
  const app = CoreAppService({ repos });

  if (watchMode) {
    // Long-running mode for development
    console.log("Starting worker in watch mode (polling every 1s)...");
    console.log("Press Ctrl+C to stop");

    while (true) {
      try {
        const processed = await processNextJob({ app });
        if (!processed) {
          // No jobs available, wait before polling again
          await new Promise((resolve) => setTimeout(resolve, pollInterval));
        }
      } catch (error) {
        console.error(
          "Error in worker loop:",
          error instanceof Error ? error.message : error
        );
        // Wait a bit before retrying on error
        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
    }
  } else {
    // Single-run mode for cron
    console.log("Processing available jobs (single run)...");

    let processed = false;
    do {
      processed = await processNextJob({ app });
    } while (processed);

    console.log("No more pending jobs. Exiting.");
    process.exit(0);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
