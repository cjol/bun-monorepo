import { CoreAppService } from "@ai-starter/app";
import { createGeneralPurposeAgent } from "@ai-starter/app/agent";
import type { Job } from "@ai-starter/core";

export interface ProcessorDeps {
  app: ReturnType<typeof CoreAppService>;
}

export interface AgentJobParameters {
  prompt: string;
  matterId: string;
  workflowId: string;
}

/**
 * Process an "agent" type job by executing the GeneralPurposeAgent
 * with the workflow instructions and prompt.
 */
async function processAgentJob(
  job: Job,
  app: ReturnType<typeof CoreAppService>
): Promise<{ success: true }> {
  const params = job.parameters as unknown as AgentJobParameters;

  // Get the workflow for its instructions
  const workflow = await app.workflow.getWorkflow(params.workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${params.workflowId} not found`);
  }

  // Create agent with workflow context
  const agent = createGeneralPurposeAgent({
    services: {
      matter: app.matter,
      bill: app.bill,
      timeEntry: app.timeEntry,
      aiSuggestion: app.aiSuggestion,
      workflow: app.workflow,
      timekeeper: app.timekeeper,
      timekeeperRole: app.timekeeperRole,
      role: app.role,
    },
    workflowInstructions: workflow.instructions,
  });

  // Execute the agent
  const agentStream = agent.stream({
    messages: [{ role: "user", content: params.prompt }],
  });

  // Consume the stream to execute the agent
  for await (const _chunk of agentStream.fullStream) {
    // Just consume the stream, don't need to process chunks
  }

  console.log(`Agent job ${job.id} for workflow ${workflow.name} completed`);

  return { success: true };
}

/**
 * Process the next pending job in the queue.
 * Returns true if a job was processed, false if no jobs were available.
 */
export async function processNextJob(deps: ProcessorDeps): Promise<boolean> {
  const { app } = deps;

  // Claim the next pending job
  const job = await app.job.claimNextJob();

  if (!job) {
    // No pending jobs
    return false;
  }

  console.log(`Processing job ${job.id} (type: ${job.type})`);

  try {
    let result: unknown;

    // Route to appropriate processor based on job type
    switch (job.type) {
      case "agent":
        result = await processAgentJob(job, app);
        break;

      default:
        throw new Error(`Unknown job type: ${(job as Job).type}`);
    }

    // Mark job as completed
    await app.job.completeJob(job.id, result as Record<string, unknown>);
    console.log(`Job ${job.id} completed successfully`);
    return true;
  } catch (error) {
    // Mark job as failed
    const errorResult = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };
    await app.job.failJob(job.id, errorResult);
    console.error(`Job ${job.id} failed:`, errorResult.error);
    return true;
  }
}
