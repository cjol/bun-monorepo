import { z } from "zod";
import { defineSandboxFunction } from "../utils";
import type { BillService } from "../../core/BillService";
import { newBillInputSchema } from "@ai-starter/core/schema/bill";
import { ulidSchema } from "@ai-starter/core/schema/utils/validation";

/**
 * Creates sandbox functions for BillService.
 * These functions are used by the general-purpose agent to interact with bills.
 */
export function createBillSandboxFunctions(service: BillService) {
  const getBill = defineSandboxFunction({
    description: "Fetch a specific bill by ID",
    inputSchema: z.object({
      id: ulidSchema.describe("The ULID of the bill to fetch"),
    }),
    execute: async ({ id }) => {
      const bill = await service.getBill(id);
      if (!bill) {
        throw new Error(`Bill with ID ${id} not found`);
      }
      return bill;
    },
  });

  const createBill = defineSandboxFunction({
    description: "Create a new bill for a matter",
    inputSchema: newBillInputSchema,
    execute: async ({ matterId, periodStart, periodEnd, status }) => {
      return service.createBill({
        matterId,
        periodStart: new Date(periodStart),
        periodEnd: new Date(periodEnd),
        status,
      });
    },
  });

  const listBillsByMatter = defineSandboxFunction({
    description: "List all bills for a specific matter",
    inputSchema: z.object({
      matterId: ulidSchema.describe("The ULID of the matter"),
    }),
    execute: async ({ matterId }) => {
      return service.listByMatter(matterId);
    },
  });

  return {
    getBill,
    createBill,
    listBillsByMatter,
  };
}
