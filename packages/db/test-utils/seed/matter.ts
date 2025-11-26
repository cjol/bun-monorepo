import { matterSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockMatters = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    clientName: "Acme Corp",
    matterName: "Patent Litigation",
    description: "Patent infringement case",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    clientName: "TechStart Inc",
    matterName: "Series A Funding",
    description: null,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedMatters = (db: DB) => {
  return db.insert(matterSchema).values([...mockMatters]);
};

/**
 * Helper to create a test matter with default values
 */
export async function createTestMatter(
  db: DB,
  overrides?: {
    clientName?: string;
    matterName?: string;
    description?: string;
  }
) {
  const [matter] = await db
    .insert(matterSchema)
    .values({
      clientName: overrides?.clientName ?? "Test Client",
      matterName: overrides?.matterName ?? "Test Matter",
      description: overrides?.description,
    })
    .returning();
  if (!matter) throw new Error("Failed to create test matter");
  return matter;
}
