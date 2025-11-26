import { billSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";
import { mockMatters } from "./matter";

export const mockBills = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    matterId: mockMatters[0].id,
    periodStart: new Date("2024-01-01"),
    periodEnd: new Date("2024-01-31"),
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    matterId: mockMatters[0].id,
    periodStart: new Date("2024-02-01"),
    periodEnd: new Date("2024-02-29"),
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedBills = (db: DB) => {
  return db.insert(billSchema).values([...mockBills]);
};

/**
 * Helper to create a test bill with default values
 */
export async function createTestBill(
  db: DB,
  matterId: string,
  overrides?: {
    periodStart?: Date;
    periodEnd?: Date;
  }
) {
  const [bill] = await db
    .insert(billSchema)
    .values({
      matterId,
      periodStart: overrides?.periodStart ?? new Date("2024-01-01"),
      periodEnd: overrides?.periodEnd ?? new Date("2024-01-31"),
    })
    .returning();
  return bill;
}
