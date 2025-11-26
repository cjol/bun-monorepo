import { billSchema, type BillRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleBillRepository = ({ db }: Deps): BillRepository => ({
  async get(id: string) {
    const result = await db.query.billSchema.findFirst({
      where: eq(billSchema.id, id),
    });
    return result ?? null;
  },

  async create(data) {
    const [result] = await db.insert(billSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Bill");
    return result;
  },

  async update(id: string, data) {
    const [result] = await db
      .update(billSchema)
      .set(data)
      .where(eq(billSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Bill with ID ${id} not found`, { id });
    }
    return result;
  },

  async delete(id: string) {
    const [result] = await db
      .delete(billSchema)
      .where(eq(billSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Bill with ID ${id} not found`, { id });
    }
  },

  async listByMatter(matterId: string) {
    const results = await db.query.billSchema.findMany({
      where: eq(billSchema.matterId, matterId),
    });
    return results;
  },
});
