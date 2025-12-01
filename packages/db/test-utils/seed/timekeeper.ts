import { roleSchema, timekeeperSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockRoles = [
  {
    id: "01HT0000000000000000000001", // Associate role ULID
    name: "Associate",
    description: "Associate lawyer",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "01HT0000000000000000000002", // Partner role ULID
    name: "Partner",
    description: "Partner lawyer",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedRoles = (db: DB) => {
  return db.insert(roleSchema).values([...mockRoles]);
};

/**
 * Helper to create a timekeeper
 */
export async function createTestTimekeeper(
  db: DB,
  overrides?: { name?: string; email?: string; id?: string }
) {
  const [timekeeper] = await db
    .insert(timekeeperSchema)
    .values({
      id: overrides?.id,
      name: overrides?.name ?? "Test Timekeeper",
      email: overrides?.email ?? "test@example.com",
    })
    .returning();
  return timekeeper;
}
