import { timeEntrySchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockTimeEntries = [
  {
    id: "time-entry-1",
    matterId: "matter-1",
    billId: "bill-1",
    date: new Date("2024-01-15"),
    hours: 2.5,
    description: "Client meeting and follow-up",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "time-entry-2",
    matterId: "matter-1",
    billId: "bill-1",
    date: new Date("2024-01-16"),
    hours: 4.0,
    description: "Document review",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "time-entry-3",
    matterId: "matter-2",
    billId: null,
    date: new Date("2024-01-20"),
    hours: 1.5,
    description: "Research",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedTimeEntries = (db: DB) => {
  return db.insert(timeEntrySchema).values([...mockTimeEntries]);
};
