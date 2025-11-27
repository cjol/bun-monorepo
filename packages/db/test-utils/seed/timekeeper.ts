import { roleSchema, timekeeperSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockRoles = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001", // Associate role UUID
    name: "Associate",
    description: "Associate lawyer",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440002", // Partner role UUID
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
  overrides?: { roleId?: string; name?: string; email?: string; id?: string }
) {
  const [timekeeper] = await db
    .insert(timekeeperSchema)
    .values({
      matterId,
      roleId: overrides?.roleId ?? "550e8400-e29b-41d4-a716-446655440001",
      id: overrides?.id,
      name: overrides?.name ?? "Test Timekeeper",
      email: overrides?.email ?? "test@example.com",
    })
    .returning();
  return timekeeper;
}
