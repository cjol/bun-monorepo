import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { TimeEntryService } from "../../core/TimeEntryService";
import {
  newTimeEntryInputSchema,
  updateTimeEntryInputSchema,
} from "@ai-starter/core/schema/timeEntry";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for TimeEntryService.
 * These functions are used by the general-purpose agent to interact with time entries.
 */
export function createTimeEntrySandboxFunctions(service: TimeEntryService) {
  const getTimeEntry = defineSandboxFunction({
    description: "Fetch a specific time entry by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the time entry to fetch"),
    }),
    execute: async ({ id }) => {
      const entry = await service.getTimeEntry(id);
      if (!entry) {
        throw new Error(`Time entry with ID ${id} not found`);
      }
      return entry;
    },
  });

  const createTimeEntry = defineSandboxFunction({
    description: "Create a new time entry",
    inputSchema: newTimeEntryInputSchema(),
    execute: async ({
      matterId,
      timekeeperId,
      billId,
      date,
      hours,
      description,
      metadata,
    }) => {
      return service.createTimeEntry({
        matterId,
        timekeeperId,
        billId,
        date: new Date(date),
        hours,
        description,
        metadata,
      });
    },
  });

  const updateTimeEntry = defineSandboxFunction({
    description:
      "Update an existing time entry (creates a changelog entry automatically)",
    inputSchema: updateTimeEntryInputSchema(),
    execute: async ({ id, date, ...data }) => {
      return service.updateTimeEntry(id, {
        ...data,
        ...(date ? { date: new Date(date) } : {}),
      });
    },
  });

  const listTimeEntriesByMatter = defineSandboxFunction({
    description: "List all time entries for a specific matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return service.listByMatter(matterId);
    },
  });

  const listTimeEntriesByBill = defineSandboxFunction({
    description: "List all time entries for a specific bill",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
      billId: ulidSchema.describe("The ULID of the bill"),
    }),
    execute: async ({ matterId, billId }) => {
      return service.listByBill(matterId, billId);
    },
  });

  return {
    getTimeEntry,
    createTimeEntry,
    updateTimeEntry,
    listTimeEntriesByMatter,
    listTimeEntriesByBill,
  };
}
