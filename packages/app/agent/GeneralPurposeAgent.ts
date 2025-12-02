import {
  Experimental_Agent as Agent,
  stepCountIs,
  type LanguageModel,
} from "ai";

import type {
  MatterService as MatterServiceType,
  BillService as BillServiceType,
  TimeEntryService as TimeEntryServiceType,
  AiSuggestionService as AiSuggestionServiceType,
  WorkflowService as WorkflowServiceType,
  TimekeeperService as TimekeeperServiceType,
  TimekeeperRoleService as TimekeeperRoleServiceType,
} from "../core";
import { createMatterSandboxFunctions } from "./sandbox/MatterServiceSandbox";
import { createBillSandboxFunctions } from "./sandbox/BillServiceSandbox";
import { createTimeEntrySandboxFunctions } from "./sandbox/TimeEntryServiceSandbox";
import { createAiSuggestionSandboxFunctions } from "./sandbox/AiSuggestionServiceSandbox";
import { createWorkflowSandboxFunctions } from "./sandbox/WorkflowServiceSandbox";
import { createTimekeeperSandboxFunctions } from "./sandbox/TimekeeperServiceSandbox";
import { createTimekeeperRoleSandboxFunctions } from "./sandbox/TimekeeperRoleServiceSandbox";
import {
  createSandboxTool,
  generateFunctionDocs,
  type SandboxFunction,
} from "./utils";
import { anthropic } from "@ai-sdk/anthropic";

/**
 * Options for creating a general-purpose agent.
 */
export interface CreateGeneralPurposeAgentOptions {
  /**
   * Application services for timesheet management operations.
   */
  services: {
    matter: MatterServiceType;
    bill: BillServiceType;
    timeEntry: TimeEntryServiceType;
    aiSuggestion: AiSuggestionServiceType;
    workflow: WorkflowServiceType;
    timekeeper: TimekeeperServiceType;
    timekeeperRole: TimekeeperRoleServiceType;
  };

  /**
   * Optional workflow instructions to include in the agent's system prompt.
   * These provide context and guidelines for the agent's behavior.
   */
  workflowInstructions?: string;

  model?: LanguageModel;
}

/**
 * Creates the sandbox functions available to the general-purpose agent.
 * These functions allow the agent to interact with matters, bills, time entries,
 * AI suggestions, and workflows.
 */
function createTimesheetManagementFunctions(
  services: CreateGeneralPurposeAgentOptions["services"]
): Record<string, SandboxFunction<unknown, unknown>> {
  return {
    ...createMatterSandboxFunctions(services.matter),
    ...createBillSandboxFunctions(services.bill),
    ...createTimeEntrySandboxFunctions(services.timeEntry),
    ...createAiSuggestionSandboxFunctions(services.aiSuggestion),
    ...createWorkflowSandboxFunctions(services.workflow),
    ...createTimekeeperSandboxFunctions(services.timekeeper),
    ...createTimekeeperRoleSandboxFunctions(services.timekeeperRole),
  } as Record<string, SandboxFunction<unknown, unknown>>;
}

/**
 * Creates a general-purpose agent for timesheet management.
 *
 * This agent can:
 * - Create, read, and update matters, bills, and time entries
 * - Query time entries by matter or bill
 * - Create AI suggestions for time entry changes
 * - Read workflow instructions for context
 * - Execute custom JavaScript code to analyze and transform data
 *
 * The agent uses a sandbox environment to execute code safely while providing
 * access to timesheet management functions.
 *
 * @param options Configuration including services and optional workflow instructions
 * @returns A configured AI agent with timesheet management capabilities
 *
 * @example
 * ```typescript
 * const agent = createGeneralPurposeAgent({
 *   services: {
 *     matter: MatterService({ repos }),
 *     bill: BillService({ repos }),
 *     timeEntry: TimeEntryService({ repos }),
 *     aiSuggestion: AiSuggestionService({ repos }),
 *     workflow: WorkflowService({ repos })
 *   },
 *   workflowInstructions: "Always validate hours are positive"
 * });
 * ```
 */
export function createGeneralPurposeAgent(
  options: CreateGeneralPurposeAgentOptions
) {
  const { services, workflowInstructions } = options;
  const sandboxFunctions = createTimesheetManagementFunctions(services);

  const systemPrompt = `You are a timesheet management assistant. You help users manage matters, bills, and time entries.

You have access to a code sandbox where you can execute JavaScript code to process and analyze timesheet data.
You can call functions directly from your code to fetch data and perform operations.

All functions are async and must be awaited.

Example usage:

\`\`\`javascript
// Fetch a matter
const matter = await getMatter({ id: "some-uuid" });
console.log("Matter:", matter.matterName);

// Create a time entry
const entry = await createTimeEntry({
  matterId: matter.id,
  billId: null,
  date: "2025-01-15",
  hours: 2.5,
  description: "Client meeting"
});

// List time entries for a matter
const entries = await listTimeEntriesByMatter({ matterId: matter.id });
const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
return totalHours;
\`\`\`

You can combine function calls with any JavaScript logic to analyze and transform data.
Use console.log() for debugging -- you will be able to see the logs in the output.

The return value will be shown to the user, but not to you to preserve your context window and protect sensitive information.

${workflowInstructions ? `\n## Workflow Instructions\n\n${workflowInstructions}\n\nFollow these instructions when executing tasks.\n` : ""}
${generateFunctionDocs(sandboxFunctions)}`;

  return new Agent({
    model: options.model || anthropic("claude-haiku-4-5"),
    system: systemPrompt,
    tools: {
      runCode: createSandboxTool({
        functions: sandboxFunctions,
        timeout: 30000,
      }),
    },
    stopWhen: stepCountIs(10),
  });
}
