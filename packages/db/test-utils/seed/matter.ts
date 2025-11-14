import { matterSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockMatters = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    clientName: "Acme Corp",
    matterName: "Contract Review",
    description: "Annual contract review",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    clientName: "TechStart Inc",
    matterName: "IP Litigation",
    description: null,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedMatters = (db: DB) => {
  return db.insert(matterSchema).values([...mockMatters]);
};
