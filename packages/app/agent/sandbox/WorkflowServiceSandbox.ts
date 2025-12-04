import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { WorkflowService } from "../../core/WorkflowService";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";
import {
  newWorkflowInputSchema,
  updateWorkflowInputSchema,
} from "@ai-starter/core/schema/workflow";

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

  const createWorkflow = defineSandboxFunction({
    description: "Create a new workflow for a matter",
    inputSchema: newWorkflowInputSchema,
    execute: async (input) => {
      return service.createWorkflow(input);
    },
  });

  const updateWorkflow = defineSandboxFunction({
    description: "Update an existing workflow",
    inputSchema: updateWorkflowInputSchema,
    execute: async ({ id, ...updates }) => {
      return service.updateWorkflow(id, updates);
    },
  });

  const deleteWorkflow = defineSandboxFunction({
    description: "Delete a workflow by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the workflow to delete"),
    }),
    execute: async ({ id }) => {
      await service.deleteWorkflow(id);
      return { success: true, id };
    },
  });

  return {
    listWorkflows,
    getWorkflow,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
  };
}
