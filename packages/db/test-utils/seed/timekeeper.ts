import { roleSchema, timekeeperSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockRoles = [
  {
    id: "role-associate",
    name: "Associate",
    description: "Associate lawyer",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "role-partner",
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
 * Helper to create a timekeeper for a matter with a default role
 */
export async function createTestTimekeeper(
  db: DB,
  matterId: string,
  roleId = "role-associate",
  overrides?: { name?: string; email?: string }
) {
  const [timekeeper] = await db
    .insert(timekeeperSchema)
    .values({
      matterId,
      roleId,
      name: overrides?.name ?? "Test Timekeeper",
      email: overrides?.email ?? "test@example.com",
    })
    .returning();
  return timekeeper;
}
