import {
  timekeeperRoleSchema,
  type TimekeeperRoleRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleTimekeeperRoleRepository = ({
  db,
}: Deps): TimekeeperRoleRepository => ({
  async get(id: string) {
    const result = await db.query.timekeeperRoleSchema.findFirst({
      where: eq(timekeeperRoleSchema.id, id),
    });
    return result ?? null;
  },
  async listByMatter(matterId: string) {
    const results = await db.query.timekeeperRoleSchema.findMany({
      where: eq(timekeeperRoleSchema.matterId, matterId),
    });
    return results;
  },
  async listByTimekeeper(timekeeperId: string) {
    const results = await db.query.timekeeperRoleSchema.findMany({
      where: eq(timekeeperRoleSchema.timekeeperId, timekeeperId),
    });
    return results;
  },
  async create(data) {
    const [result] = await db
      .insert(timekeeperRoleSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to create TimekeeperRole");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(timekeeperRoleSchema)
      .set(data)
      .where(eq(timekeeperRoleSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`TimekeeperRole with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(timekeeperRoleSchema)
      .where(eq(timekeeperRoleSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`TimekeeperRole with ID ${id} not found`, { id });
    }
  },
});
