import { matterSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

// Note: We can't easily create Zod schemas here since zod isn't a dependency of @ai-starter/db
// The first mock matter will have null for timeEntryMetadataSchema
// Real schemas can be added when creating test matters via createTestMatter helper
export const mockMatters = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    clientName: "Acme Corp",
    matterName: "Patent Litigation",
    description: "Patent infringement case",
    timeEntryMetadataSchema: null,
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    clientName: "TechStart Inc",
    matterName: "Series A Funding",
    description: null,
    timeEntryMetadataSchema: null,
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
  overrides?: Partial<typeof matterSchema.$inferInsert>
) {
  const [matter] = await db
    .insert(matterSchema)
    .values({
      clientName: overrides?.clientName ?? "Test Client",
      matterName: overrides?.matterName ?? "Test Matter",
      description: overrides?.description ?? null,
      timeEntryMetadataSchema: overrides?.timeEntryMetadataSchema ?? null,
    })
    .returning();
  if (!matter) throw new Error("Failed to create test matter");
  return matter;
}
