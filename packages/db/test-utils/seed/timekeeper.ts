import {
  roleSchema,
  timekeeperSchema,
  timekeeperRoleSchema,
} from "@ai-starter/core";
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

/**
 * Helper to create a timekeeper role
 */
export async function createTestTimekeeperRole(
  db: DB,
  timekeeperId: string,
  matterId: string,
  overrides?: { roleId?: string; billableRate?: number }
) {
  // Use the Associate role by default (first mock role)
  const defaultRoleId = overrides?.roleId ?? mockRoles[0].id;

  const [timekeeperRole] = await db
    .insert(timekeeperRoleSchema)
    .values({
      timekeeperId,
      matterId,
      roleId: defaultRoleId,
      billableRate: overrides?.billableRate ?? 250.0,
    })
    .returning();
  return timekeeperRole;
}
