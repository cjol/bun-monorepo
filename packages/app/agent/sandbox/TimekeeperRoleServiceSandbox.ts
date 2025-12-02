import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { TimekeeperRoleService } from "../../core/TimekeeperRoleService";
import {
  newTimekeeperRoleInputSchema,
  updateTimekeeperRoleInputSchema,
} from "@ai-starter/core/schema/timekeeperRole";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for TimekeeperRoleService.
 * These functions are used by the general-purpose agent to interact with timekeeper roles.
 */
export function createTimekeeperRoleSandboxFunctions(
  service: TimekeeperRoleService
) {
  const getTimekeeperRole = defineSandboxFunction({
    description: "Fetch a specific timekeeper role by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the timekeeper role to fetch"),
    }),
    execute: async ({ id }) => {
      const role = await service.getTimekeeperRole(id);
      if (!role) {
        throw new Error(`TimekeeperRole with ID ${id} not found`);
      }
      return role;
    },
  });

  const createTimekeeperRole = defineSandboxFunction({
    description: "Create a new timekeeper role assignment",
    inputSchema: newTimekeeperRoleInputSchema,
    execute: async ({ timekeeperId, matterId, role, billableRate }) => {
      return service.createTimekeeperRole({
        timekeeperId,
        matterId,
        role,
        billableRate,
      });
    },
  });

  const updateTimekeeperRole = defineSandboxFunction({
    description: "Update an existing timekeeper role",
    inputSchema: updateTimekeeperRoleInputSchema,
    execute: async ({ id, ...data }) => {
      return service.updateTimekeeperRole(id, data);
    },
  });

  const listTimekeeperRolesByMatter = defineSandboxFunction({
    description: "List all timekeeper roles for a specific matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return service.listByMatter(matterId);
    },
  });

  const listTimekeeperRolesByTimekeeper = defineSandboxFunction({
    description: "List all roles for a specific timekeeper",
    inputSchema: z.object({
      timekeeperId: ulidSchema.describe("The ULID of the timekeeper"),
    }),
    execute: async ({ timekeeperId }) => {
      return service.listByTimekeeper(timekeeperId);
    },
  });

  return {
    getTimekeeperRole,
    createTimekeeperRole,
    updateTimekeeperRole,
    listTimekeeperRolesByMatter,
    listTimekeeperRolesByTimekeeper,
  };
}
