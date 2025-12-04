import {
  createGeneralPurposeAgent,
  type CreateGeneralPurposeAgentOptions,
  type SandboxFunctionName,
} from "./GeneralPurposeAgent";

/**
 * Sandbox functions allowed for customer-facing agents.
 * Excludes direct time entry modifications - customers must use AI suggestions instead.
 */
const CUSTOMER_ALLOWED_FUNCTIONS: SandboxFunctionName[] = [
  // Matter (read + write for customers)
  "listMatters",
  "getMatter",
  "createMatter",
  "updateMatter",
  // Bill (read + write for customers)
  "getBill",
  "createBill",
  "listBillsByMatter",
  // TimeEntry (read + write for customers)
  "getTimeEntry",
  "createTimeEntries",
  "listTimeEntriesByMatter",
  "listTimeEntriesByBill",
  // AiSuggestion (full access - this is the preferred write path)
  "createAiSuggestion",
  "listPendingSuggestions",
  // Workflow (read + write for customers)
  "listWorkflows",
  "getWorkflow",
  "createWorkflow",
  "updateWorkflow",
  "deleteWorkflow",
  // Timekeeper (read-only)
  "getTimekeeper",
  "getTimekeeperByEmail",
  "listAllTimekeepers",
  // TimekeeperRole (read-only)
  "getTimekeeperRole",
  "listTimekeeperRolesByMatter",
  "listTimekeeperRolesByTimekeeper",
  // Role (read-only)
  "getRole",
  "listRoles",
];

/**
 * Options for creating a customer-facing agent.
 * Same as CreateGeneralPurposeAgentOptions but without allowedFunctions
 * (which is pre-configured for customer safety).
 */
export type CreateCustomerAgentOptions = Omit<
  CreateGeneralPurposeAgentOptions,
  "allowedFunctions"
>;

/**
 * Creates a customer-facing agent with restricted capabilities.
 *
 * This agent can create and modify time entries, matters, bills, and workflows,
 * but cannot modify timekeepers, timekeeper roles, or roles.
 *
 * Use this for workflow processing and any customer-initiated interactions.
 */
export function createCustomerAgent(options: CreateCustomerAgentOptions) {
  return createGeneralPurposeAgent({
    ...options,
    allowedFunctions: CUSTOMER_ALLOWED_FUNCTIONS,
  });
}
