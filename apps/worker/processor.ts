import { CoreAppService } from "@ai-starter/app";
import { type LanguageModel } from "@ai-starter/app/agent";
import type { Job } from "@ai-starter/core";
import { processAgentJob, type AgentResultType } from "./jobs/processAgentJob";

export interface ProcessorDeps {
  app: ReturnType<typeof CoreAppService>;
  model: LanguageModel;
  logger?: { log: (msg: string) => void; error: (msg: string) => void };
}

/**
 * Process the next pending job in the queue.
 * Returns true if a job was processed, false if no jobs were available.
 */
export async function processNextJob(deps: ProcessorDeps): Promise<boolean> {
  const { app, logger } = deps;

  // Claim the next pending job
  const job = await app.job.claimNextJob();

  if (!job) {
    // No pending jobs
    return false;
  }
  logger?.log(`Processing job ${job.id} of type ${job.type}`);

  try {
    let result: unknown;

    // Route to appropriate processor based on job type
    switch (job.type) {
      case "agent":
        result = await processAgentJob(job, deps);
        logger?.log(`Agent job ${job.id} processed successfully`);
        break;

      default:
        logger?.error(`Unknown job type: ${(job as Job).type}`);
        throw new Error(`Unknown job type: ${(job as Job).type}`);
    }

    // Mark job as completed
    await app.job.completeJob(job.id, result as Record<string, unknown>);
    return true;
  } catch (error) {
    console.error(error);
    // Mark job as failed
    const errorResult = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    await app.job.failJob(job.id, errorResult);
    logger?.error(`Job ${job.id} failed: ${errorResult.error}`);
    return true;
  }
}

export type JobResultType = { error: string; stack?: string } | AgentResultType;
