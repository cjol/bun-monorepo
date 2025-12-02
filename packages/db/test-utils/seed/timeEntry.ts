import { timeEntrySchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";
import { mockMatters } from "./matter";
import { mockBills } from "./bill";

// Note: These mock time entries reference mockMatters[0] and need a timekeeperId
// They are intended to be used after seeding matters and creating timekeepers
export const mockTimeEntries = [
  {
    id: "00000000-0000-4000-8000-000000000301",
    matterId: mockMatters[0].id,
    billId: mockBills[0].id,
    // timekeeperId must be provided when using this mock
    date: new Date("2024-01-15"),
    hours: 2.5,
    description: "Research case law on patent claims",
    metadata: { category: "research", urgency: "high" },
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000302",
    matterId: mockMatters[0].id,
    billId: mockBills[0].id,
    // timekeeperId must be provided when using this mock
    date: new Date("2024-01-16"),
    hours: 3.0,
    description: "Draft motion to dismiss",
    metadata: { category: "drafting", urgency: "medium" },
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

/**
 * Seed time entries - requires timekeeperId to be provided
 */
export function doSeedTimeEntries(db: DB, timekeeperId: string) {
  return db.insert(timeEntrySchema).values(
    mockTimeEntries.map((entry) => ({
      ...entry,
      timekeeperId,
    }))
  );
}

/**
 * Helper to create a test time entry with default values
 */
export async function createTestTimeEntry(
  db: DB,
  matterId: string,
  timekeeperId: string,
  overrides?: {
    billId?: string;
    date?: Date;
    hours?: number;
    description?: string;
    metadata?: Record<string, string>;
  }
) {
  const [timeEntry] = await db
    .insert(timeEntrySchema)
    .values({
      matterId,
      timekeeperId,
      billId: overrides?.billId,
      date: overrides?.date ?? new Date("2024-01-15"),
      hours: overrides?.hours ?? 2.0,
      description: overrides?.description ?? "Test time entry",
      metadata: overrides?.metadata ?? {},
    })
    .returning();
  if (!timeEntry) throw new Error("Failed to create test time entry");
  return timeEntry;
}
