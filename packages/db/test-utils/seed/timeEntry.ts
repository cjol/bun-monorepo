import { timeEntrySchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockTimeEntries = [
  {
    id: "00000000-0000-4000-8000-000000000201",
    matterId: "00000000-0000-4000-8000-000000000001",
    billId: "00000000-0000-4000-8000-000000000101",
    date: new Date("2024-01-15"),
    hours: 2.5,
    description: "Client meeting and follow-up",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    matterId: "00000000-0000-4000-8000-000000000001",
    billId: "00000000-0000-4000-8000-000000000101",
    date: new Date("2024-01-16"),
    hours: 4.0,
    description: "Document review",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    matterId: "00000000-0000-4000-8000-000000000002",
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
