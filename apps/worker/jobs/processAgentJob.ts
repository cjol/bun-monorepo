import { createGeneralPurposeAgent, buildMatterContext } from "@ai-starter/app";
import type { Job } from "@ai-starter/core";
import type { ProcessorDeps } from "../processor";

export interface AgentJobParameters {
  prompt: string;
  matterId: string;
  workflowId: string;
}

/**
 * Process an "agent" type job by executing the GeneralPurposeAgent
 * with the matter context, workflow instructions and prompt.
 */
export async function processAgentJob(job: Job, { app, model }: ProcessorDeps) {
  const params = job.parameters as unknown as AgentJobParameters;

  // Get the workflow for its instructions
  const workflow = await app.workflow.getWorkflow(params.workflowId);
  if (!workflow) {
    throw new Error(`Workflow ${params.workflowId} not found`);
  }

  // Build matter context
  const matterContext = await buildMatterContext(params.matterId, {
    services: {
      matter: app.matter,
      timekeeperRole: app.timekeeperRole,
      bill: app.bill,
    },
  });

  // Create agent with matter context and workflow instructions
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
    matterContext,
    workflowInstructions: workflow.instructions,
    model: model,
  });

  // Execute the agent
  const result = await agent.generate({
    messages: [{ role: "user", content: params.prompt }],
  });

  return {
    success: true,
    result: result.content,
    logs: result.steps.map((s) => s.content),
  };
}
