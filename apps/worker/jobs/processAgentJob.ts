import { createGeneralPurposeAgent } from "@ai-starter/app";
import type { Job } from "@ai-starter/core";
import type { ProcessorDeps } from "../processor";

export interface AgentJobParameters {
  prompt: string;
  matterId: string;
  workflowId: string;
}

/**
 * Process an "agent" type job by executing the GeneralPurposeAgent
 * with the workflow instructions and prompt.
 */
export async function processAgentJob(job: Job, { app, model }: ProcessorDeps) {
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
    model: model,
  });

  // Execute the agent
  const result = await agent.generate({
    messages: [{ role: "user", content: params.prompt }],
  });
  console.log(workflow.instructions);
  console.log(params.prompt);

  console.log(`Agent job ${job.id} for workflow ${workflow.name} completed`);

  return {
    success: true,
    result: result.content,
    logs: result.steps.map((s) => s.content),
  };
}
