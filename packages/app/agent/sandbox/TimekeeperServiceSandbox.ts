import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { TimekeeperService } from "../../core/TimekeeperService";
import {
  newTimekeeperInputSchema,
  updateTimekeeperInputSchema,
} from "@ai-starter/core/schema/timekeeper";
import {
  uuidSchema,
  emailSchema,
} from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for TimekeeperService.
 * These functions are used by the general-purpose agent to interact with timekeepers.
 */
export function createTimekeeperSandboxFunctions(service: TimekeeperService) {
  const getTimekeeper = defineSandboxFunction({
    description: "Fetch a specific timekeeper by ID",
    inputSchema: z.object({
      id: uuidSchema.describe("The ULID of the timekeeper to fetch"),
    }),
    execute: async ({ id }) => {
      const timekeeper = await service.getTimekeeper(id);
      if (!timekeeper) {
        throw new Error(`Timekeeper with ID ${id} not found`);
      }
      return timekeeper;
    },
  });

  const getTimekeeperByEmail = defineSandboxFunction({
    description: "Fetch a timekeeper by email address",
    inputSchema: z.object({
      email: emailSchema.describe("The email address of the timekeeper"),
    }),
    execute: async ({ email }) => {
      const timekeeper = await service.getTimekeeperByEmail(email);
      if (!timekeeper) {
        throw new Error(`Timekeeper with email ${email} not found`);
      }
      return timekeeper;
    },
  });

  const createTimekeeper = defineSandboxFunction({
    description: "Create a new timekeeper",
    inputSchema: newTimekeeperInputSchema,
    execute: async ({ name, email }) => {
      return service.createTimekeeper({
        name,
        email,
      });
    },
  });

  const updateTimekeeper = defineSandboxFunction({
    description: "Update an existing timekeeper",
    inputSchema: updateTimekeeperInputSchema,
    execute: async ({ id, ...data }) => {
      return service.updateTimekeeper(id, data);
    },
  });

  const listAllTimekeepers = defineSandboxFunction({
    description: "List all timekeepers",
    inputSchema: z.object({}),
    execute: async () => {
      return service.listAllTimekeepers();
    },
  });

  return {
    getTimekeeper,
    getTimekeeperByEmail,
    createTimekeeper,
    updateTimekeeper,
    listAllTimekeepers,
  };
}
