import { timekeeperSchema, type TimekeeperRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleTimekeeperRepository = ({
  db,
}: Deps): TimekeeperRepository => ({
  async get(id: string) {
    const result = await db.query.timekeeperSchema.findFirst({
      where: eq(timekeeperSchema.id, id),
    });
    return result ?? null;
  },
  async getByEmail(email: string) {
    const result = await db.query.timekeeperSchema.findFirst({
      where: eq(timekeeperSchema.email, email),
    });
    return result ?? null;
  },
  async listAll() {
    const results = await db.query.timekeeperSchema.findMany();
    return results;
  },
  async create(data) {
    const [result] = await db.insert(timekeeperSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Timekeeper");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(timekeeperSchema)
      .set(data)
      .where(eq(timekeeperSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Timekeeper with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(timekeeperSchema)
      .where(eq(timekeeperSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Timekeeper with ID ${id} not found`, { id });
    }
  },
});
