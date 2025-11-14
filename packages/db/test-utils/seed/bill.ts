import { billSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockBills = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    matterId: "00000000-0000-4000-8000-000000000001",
    periodStart: new Date("2024-01-01"),
    periodEnd: new Date("2024-01-31"),
    status: "draft" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    matterId: "00000000-0000-4000-8000-000000000001",
    periodStart: new Date("2024-02-01"),
    periodEnd: new Date("2024-02-29"),
    status: "finalized" as const,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    matterId: "00000000-0000-4000-8000-000000000002",
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
