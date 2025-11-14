import { matterSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockMatters = [
  {
    id: "matter-1",
    clientName: "Acme Corp",
    matterName: "Contract Review",
    description: "Annual contract review",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "matter-2",
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
