import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { RoleService } from "../../core/RoleService";
import {
  newRoleInputSchema,
  updateRoleInputSchema,
} from "@ai-starter/core/schema/role";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for RoleService.
 * These functions are used by the general-purpose agent to interact with roles.
 */
export function createRoleSandboxFunctions(service: RoleService) {
  const getRole = defineSandboxFunction({
    description: "Fetch a specific role by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the role to fetch"),
    }),
    execute: async ({ id }) => {
      const role = await service.getRole(id);
      if (!role) {
        throw new Error(`Role with ID ${id} not found`);
      }
      return role;
    },
  });

  const listRoles = defineSandboxFunction({
    description: "List all roles",
    inputSchema: z.object({}),
    execute: async () => {
      return service.listRoles();
    },
  });

  const createRole = defineSandboxFunction({
    description: "Create a new role",
    inputSchema: newRoleInputSchema,
    execute: async (data) => {
      return service.createRole(data);
    },
  });

  const updateRole = defineSandboxFunction({
    description: "Update an existing role",
    inputSchema: updateRoleInputSchema,
    execute: async ({ id, ...data }) => {
      return service.updateRole(id, data);
    },
  });

  const deleteRole = defineSandboxFunction({
    description: "Delete a role",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the role to delete"),
    }),
    execute: async ({ id }) => {
      await service.deleteRole(id);
      return { success: true };
    },
  });

  return {
    getRole,
    listRoles,
    createRole,
    updateRole,
    deleteRole,
  };
}
