import { createCustomerAgent, buildMatterContext } from "@ai-starter/app";
import type { Job } from "@ai-starter/core";
import type { ProcessorDeps } from "../processor";
import type { GenerateTextResult, ToolSet } from "ai";

export type ResponseMessage = GenerateTextResult<
  ToolSet,
  unknown
>["response"]["messages"][number];

export interface AgentJobParameters {
  prompt: string;
  matterId: string;
  workflowId: string;
}
export interface AgentResultType {
  success: true;
  result: ResponseMessage[];
}

/**
 * Process an "agent" type job by executing the GeneralPurposeAgent
 * with the matter context, workflow instructions and prompt.
 */
export async function processAgentJob(
  job: Job,
  { app, model }: ProcessorDeps
): Promise<AgentResultType> {
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

  // Get time entry IDs from job entities for context
  const jobEntities = await app.job.listEntitiesByJob(job.id);
  const timeEntryIds = jobEntities
    .filter((entity) => entity.entityType === "time_entry")
    .map((entity) => entity.entityId);

  // Create agent with matter context and workflow instructions
  const agent = createCustomerAgent({
    services: {
      matter: app.matter,
      bill: app.bill,
      timeEntry: app.timeEntry,
      aiSuggestion: app.aiSuggestion,
      workflow: app.workflow,
      timekeeper: app.timekeeper,
      timekeeperRole: app.timekeeperRole,
      role: app.role,
      document: app.document,
      documentTemplate: app.documentTemplate,
      activityLog: app.activityLog,
    },
    matterContext,
    workflowInstructions: workflow.instructions,
    model: model,
    timeEntryContext: { timeEntryIds },
  });

  // Execute the agent
  const result = await agent.generate({
    messages: [{ role: "user", content: params.prompt }],
  });

  return {
    success: true,
    result: result.response.messages,
  };
}
