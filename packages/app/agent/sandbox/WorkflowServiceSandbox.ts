import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { WorkflowService } from "../../core/WorkflowService";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for WorkflowService.
 * These functions are used by the general-purpose agent to interact with workflows.
 */
export function createWorkflowSandboxFunctions(service: WorkflowService) {
  const listWorkflows = defineSandboxFunction({
    description: "List all available workflows for a matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return service.listByMatter(matterId);
    },
  });

  const getWorkflow = defineSandboxFunction({
    description: "Fetch a specific workflow by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the workflow to fetch"),
    }),
    execute: async ({ id }) => {
      const workflow = await service.getWorkflow(id);
      if (!workflow) {
        throw new Error(`Workflow with ID ${id} not found`);
      }
      return workflow;
    },
  });

  return {
    listWorkflows,
    getWorkflow,
  };
}
