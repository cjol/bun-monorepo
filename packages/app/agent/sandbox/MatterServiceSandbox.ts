import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { MatterService } from "../../core/MatterService";
import {
  newMatterInputSchema,
  updateMatterInputSchema,
} from "@ai-starter/core/schema/matter";
import { uuidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for MatterService.
 * These functions are used by the general-purpose agent to interact with matters.
 */
export function createMatterSandboxFunctions(service: MatterService) {
  const getMatter = defineSandboxFunction({
    description: "Fetch a specific matter by ID",
    inputSchema: z.object({
      id: uuidSchema.describe("The UUID of the matter to fetch"),
    }),
    execute: async ({ id }) => {
      const matter = await service.getMatter(id);
      if (!matter) {
        throw new Error(`Matter with ID ${id} not found`);
      }
      return matter;
    },
  });

  const createMatter = defineSandboxFunction({
    description: "Create a new matter",
    inputSchema: newMatterInputSchema,
    execute: async ({ clientName, matterName, description }) => {
      return service.createMatter({
        clientName,
        matterName,
        description,
      });
    },
  });

  const updateMatter = defineSandboxFunction({
    description: "Update an existing matter",
    inputSchema: updateMatterInputSchema,
    execute: async ({ id, ...data }) => {
      return service.updateMatter(id, data);
    },
  });

  return {
    getMatter,
    createMatter,
    updateMatter,
  };
}
