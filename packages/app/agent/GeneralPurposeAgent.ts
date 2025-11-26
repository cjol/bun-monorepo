import { Experimental_Agent as Agent, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type {
  MatterService as MatterServiceType,
  BillService as BillServiceType,
  TimeEntryService as TimeEntryServiceType,
  AiSuggestionService as AiSuggestionServiceType,
  WorkflowService as WorkflowServiceType,
  TimekeeperService as TimekeeperServiceType,
  TimekeeperRoleService as TimekeeperRoleServiceType,
} from "../core";
import {
  createSandboxTool,
  generateFunctionDocs,
  type SandboxFunction,
} from "./utils";

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
}

/**
 * Creates the sandbox functions available to the general-purpose agent.
 * These functions allow the agent to interact with matters, bills, time entries,
 * AI suggestions, and workflows.
 */
function createTimesheetManagementFunctions(
  services: CreateGeneralPurposeAgentOptions["services"]
) {
  // Matter functions
  const getMatter: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific matter by ID",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the matter to fetch"),
    }),
    execute: async ({ id }) => {
      const matter = await services.matter.getMatter(id);
      if (!matter) {
        throw new Error(`Matter with ID ${id} not found`);
      }
      return matter;
    },
  };

  const createMatter: SandboxFunction<
    { clientName: string; matterName: string; description: string | null },
    unknown
  > = {
    description: "Create a new matter",
    inputSchema: z.object({
      clientName: z.string().describe("Name of the client"),
      matterName: z.string().describe("Name of the matter"),
      description: z
        .string()
        .nullable()
        .describe("Optional description of the matter"),
    }),
    execute: async ({ clientName, matterName, description }) => {
      return services.matter.createMatter({
        clientName,
        matterName,
        description,
      });
    },
  };

  const updateMatter: SandboxFunction<
    {
      id: string;
      clientName?: string;
      matterName?: string;
      description?: string | null;
    },
    unknown
  > = {
    description: "Update an existing matter",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the matter to update"),
      clientName: z.string().optional().describe("New client name"),
      matterName: z.string().optional().describe("New matter name"),
      description: z.string().nullable().optional().describe("New description"),
    }),
    execute: async ({ id, ...data }) => {
      return services.matter.updateMatter(id, data);
    },
  };

  // Bill functions
  const getBill: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific bill by ID",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the bill to fetch"),
    }),
    execute: async ({ id }) => {
      const bill = await services.bill.getBill(id);
      if (!bill) {
        throw new Error(`Bill with ID ${id} not found`);
      }
      return bill;
    },
  };

  const createBill: SandboxFunction<
    {
      matterId: string;
      periodStart: string;
      periodEnd: string;
      status: "draft" | "finalized" | "sent" | "paid";
    },
    unknown
  > = {
    description: "Create a new bill for a matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
      periodStart: z
        .string()
        .describe("ISO date string for period start (e.g. 2025-01-01)"),
      periodEnd: z
        .string()
        .describe("ISO date string for period end (e.g. 2025-01-31)"),
      status: z
        .enum(["draft", "finalized", "sent", "paid"])
        .describe("Status of the bill"),
    }),
    execute: async ({ matterId, periodStart, periodEnd, status }) => {
      return services.bill.createBill({
        matterId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status,
      });
    },
  };

  const listBillsByMatter: SandboxFunction<{ matterId: string }, unknown[]> = {
    description: "List all bills for a specific matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return services.bill.listByMatter(matterId);
    },
  };

  // Time entry functions
  const getTimeEntry: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific time entry by ID",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the time entry to fetch"),
    }),
    execute: async ({ id }) => {
      const entry = await services.timeEntry.getTimeEntry(id);
      if (!entry) {
        throw new Error(`Time entry with ID ${id} not found`);
      }
      return entry;
    },
  };

  const createTimeEntry: SandboxFunction<
    {
      matterId: string;
      timekeeperId: string;
      billId: string | null;
      date: string;
      hours: number;
      description: string;
    },
    unknown
  > = {
    description: "Create a new time entry",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
      timekeeperId: z.string().uuid().describe("The UUID of the timekeeper"),
      billId: z
        .string()
        .uuid()
        .nullable()
        .describe("The UUID of the bill (if assigned)"),
      date: z.string().describe("ISO date string (e.g. 2025-01-01)"),
      hours: z.number().positive().describe("Number of hours worked"),
      description: z.string().describe("Description of the work performed"),
    }),
    execute: async ({
      matterId,
      timekeeperId,
      billId,
      date,
      hours,
      description,
    }) => {
      return services.timeEntry.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date(date),
        hours,
        description,
      });
    },
  };

  const updateTimeEntry: SandboxFunction<
    {
      id: string;
      matterId?: string;
      billId?: string | null;
      date?: string;
      hours?: number;
      description?: string;
    },
    unknown
  > = {
    description:
      "Update an existing time entry (creates a changelog entry automatically)",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the time entry to update"),
      matterId: z.string().uuid().optional().describe("New matter ID"),
      billId: z.string().uuid().nullable().optional().describe("New bill ID"),
      date: z.string().optional().describe("New date (ISO string)"),
      hours: z.number().positive().optional().describe("New hours"),
      description: z.string().optional().describe("New description"),
    }),
    execute: async ({ id, date, ...data }) => {
      return services.timeEntry.updateTimeEntry(id, {
        ...data,
        ...(date ? { date: new Date(date) } : {}),
      });
    },
  };

  const listTimeEntriesByMatter: SandboxFunction<
    { matterId: string },
    unknown[]
  > = {
    description: "List all time entries for a specific matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return services.timeEntry.listByMatter(matterId);
    },
  };

  const listTimeEntriesByBill: SandboxFunction<
    { matterId: string; billId: string },
    unknown[]
  > = {
    description: "List all time entries for a specific bill",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
      billId: z.string().uuid().describe("The UUID of the bill"),
    }),
    execute: async ({ matterId, billId }) => {
      return services.timeEntry.listByBill(matterId, billId);
    },
  };

  // AI suggestion functions
  const createAiSuggestion: SandboxFunction<
    {
      timeEntryId: string;
      suggestedChanges: {
        matterId: string;
        timekeeperId: string;
        date: string;
        hours: number;
        description: string;
        billId?: string | null;
      };
    },
    unknown
  > = {
    description:
      "Create an AI suggestion for time entry changes (for review/approval)",
    inputSchema: z.object({
      timeEntryId: z
        .string()
        .uuid()
        .describe("The UUID of the time entry to suggest changes for"),
      suggestedChanges: z
        .object({
          matterId: z.string().uuid().describe("Matter ID for the suggestion"),
          timekeeperId: z
            .string()
            .uuid()
            .describe("Timekeeper ID for the suggestion"),
          date: z.string().describe("ISO date string for the suggestion"),
          hours: z.number().positive().describe("Suggested hours"),
          description: z.string().describe("Suggested description"),
          billId: z
            .string()
            .uuid()
            .nullable()
            .optional()
            .describe("Optional bill ID"),
        })
        .describe("Object containing the suggested time entry changes"),
    }),
    execute: async ({ timeEntryId, suggestedChanges }) => {
      return services.aiSuggestion.createSuggestion({
        timeEntryId,
        suggestedChanges: {
          ...suggestedChanges,
          date: new Date(suggestedChanges.date),
        },
      });
    },
  };

  const listPendingSuggestions: SandboxFunction<
    { matterId: string },
    unknown[]
  > = {
    description: "List all pending AI suggestions for a matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return services.aiSuggestion.listByStatus(matterId, "pending");
    },
  };

  // Workflow functions
  const listWorkflows: SandboxFunction<{ matterId: string }, unknown[]> = {
    description: "List all available workflows for a matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return services.workflow.listByMatter(matterId);
    },
  };

  const getWorkflow: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific workflow by ID",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the workflow to fetch"),
    }),
    execute: async ({ id }) => {
      const workflow = await services.workflow.getWorkflow(id);
      if (!workflow) {
        throw new Error(`Workflow with ID ${id} not found`);
      }
      return workflow;
    },
  };

  // Timekeeper functions
  const getTimekeeper: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific timekeeper by ID",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the timekeeper to fetch"),
    }),
    execute: async ({ id }) => {
      const timekeeper = await services.timekeeper.getTimekeeper(id);
      if (!timekeeper) {
        throw new Error(`Timekeeper with ID ${id} not found`);
      }
      return timekeeper;
    },
  };

  const getTimekeeperByEmail: SandboxFunction<{ email: string }, unknown> = {
    description: "Fetch a timekeeper by email address",
    inputSchema: z.object({
      email: z.string().email().describe("The email address of the timekeeper"),
    }),
    execute: async ({ email }) => {
      const timekeeper = await services.timekeeper.getTimekeeperByEmail(email);
      if (!timekeeper) {
        throw new Error(`Timekeeper with email ${email} not found`);
      }
      return timekeeper;
    },
  };

  const createTimekeeper: SandboxFunction<
    {
      matterId: string;
      roleId: string;
      name: string;
      email: string;
    },
    unknown
  > = {
    description: "Create a new timekeeper",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
      roleId: z.string().uuid().describe("The UUID of the role"),
      name: z.string().describe("Name of the timekeeper"),
      email: z.string().email().describe("Email address of the timekeeper"),
    }),
    execute: async ({ matterId, roleId, name, email }) => {
      return services.timekeeper.createTimekeeper({
        matterId,
        roleId,
        name,
        email,
      });
    },
  };

  const updateTimekeeper: SandboxFunction<
    {
      id: string;
      matterId?: string;
      roleId?: string;
      name?: string;
      email?: string;
    },
    unknown
  > = {
    description: "Update an existing timekeeper",
    inputSchema: z.object({
      id: z.string().uuid().describe("The UUID of the timekeeper to update"),
      matterId: z.string().uuid().optional().describe("New matter ID"),
      roleId: z.string().uuid().optional().describe("New role ID"),
      name: z.string().optional().describe("New name"),
      email: z.string().email().optional().describe("New email address"),
    }),
    execute: async ({ id, ...data }) => {
      return services.timekeeper.updateTimekeeper(id, data);
    },
  };

  const listAllTimekeepers: SandboxFunction<unknown, unknown[]> = {
    description: "List all timekeepers",
    inputSchema: z.object({}),
    execute: async () => {
      return services.timekeeper.listAllTimekeepers();
    },
  };

  // TimekeeperRole functions
  const getTimekeeperRole: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific timekeeper role by ID",
    inputSchema: z.object({
      id: z
        .string()
        .uuid()
        .describe("The UUID of the timekeeper role to fetch"),
    }),
    execute: async ({ id }) => {
      const role = await services.timekeeperRole.getTimekeeperRole(id);
      if (!role) {
        throw new Error(`TimekeeperRole with ID ${id} not found`);
      }
      return role;
    },
  };

  const createTimekeeperRole: SandboxFunction<
    {
      timekeeperId: string;
      matterId: string;
      role: string;
      billableRate: number;
    },
    unknown
  > = {
    description: "Create a new timekeeper role assignment",
    inputSchema: z.object({
      timekeeperId: z.string().uuid().describe("The UUID of the timekeeper"),
      matterId: z.string().uuid().describe("The UUID of the matter"),
      role: z.string().describe("Role title (e.g. Associate, Partner)"),
      billableRate: z.number().positive().describe("Hourly billable rate"),
    }),
    execute: async ({ timekeeperId, matterId, role, billableRate }) => {
      return services.timekeeperRole.createTimekeeperRole({
        timekeeperId,
        matterId,
        role,
        billableRate,
      });
    },
  };

  const updateTimekeeperRole: SandboxFunction<
    {
      id: string;
      timekeeperId?: string;
      matterId?: string;
      role?: string;
      billableRate?: number;
    },
    unknown
  > = {
    description: "Update an existing timekeeper role",
    inputSchema: z.object({
      id: z
        .string()
        .uuid()
        .describe("The UUID of the timekeeper role to update"),
      timekeeperId: z.string().uuid().optional().describe("New timekeeper ID"),
      matterId: z.string().uuid().optional().describe("New matter ID"),
      role: z.string().optional().describe("New role title"),
      billableRate: z
        .number()
        .positive()
        .optional()
        .describe("New hourly rate"),
    }),
    execute: async ({ id, ...data }) => {
      return services.timekeeperRole.updateTimekeeperRole(id, data);
    },
  };

  const listTimekeeperRolesByMatter: SandboxFunction<
    { matterId: string },
    unknown[]
  > = {
    description: "List all timekeeper roles for a specific matter",
    inputSchema: z.object({
      matterId: z.string().uuid().describe("The UUID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return services.timekeeperRole.listByMatter(matterId);
    },
  };

  const listTimekeeperRolesByTimekeeper: SandboxFunction<
    { timekeeperId: string },
    unknown[]
  > = {
    description: "List all roles for a specific timekeeper",
    inputSchema: z.object({
      timekeeperId: z.string().uuid().describe("The UUID of the timekeeper"),
    }),
    execute: async ({ timekeeperId }) => {
      return services.timekeeperRole.listByTimekeeper(timekeeperId);
    },
  };

  return {
    getMatter,
    createMatter,
    updateMatter,
    getBill,
    createBill,
    listBillsByMatter,
    getTimeEntry,
    createTimeEntry,
    updateTimeEntry,
    listTimeEntriesByMatter,
    listTimeEntriesByBill,
    createAiSuggestion,
    listPendingSuggestions,
    listWorkflows,
    getWorkflow,
    getTimekeeper,
    getTimekeeperByEmail,
    createTimekeeper,
    updateTimekeeper,
    listAllTimekeepers,
    getTimekeeperRole,
    createTimekeeperRole,
    updateTimekeeperRole,
    listTimekeeperRolesByMatter,
    listTimekeeperRolesByTimekeeper,
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
    model: anthropic("claude-haiku-4-5"),
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
