import { billSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockBills = [
  {
    id: "bill-1",
    matterId: "matter-1",
    periodStart: new Date("2024-01-01"),
    periodEnd: new Date("2024-01-31"),
    status: "draft" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "bill-2",
    matterId: "matter-1",
    periodStart: new Date("2024-02-01"),
    periodEnd: new Date("2024-02-29"),
    status: "finalized" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "bill-3",
    matterId: "matter-2",
    periodStart: new Date("2024-01-01"),
    periodEnd: new Date("2024-01-31"),
    status: "sent" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedBills = (db: DB) => {
  return db.insert(billSchema).values([...mockBills]);
};
