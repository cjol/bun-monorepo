import { matterSchema, type MatterRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleMatterRepository = ({ db }: Deps): MatterRepository => ({
  async get(id: string) {
    const result = await db.query.matterSchema.findFirst({
      where: eq(matterSchema.id, id),
    });
    return result ?? null;
  },
  async create(data) {
    const [result] = await db.insert(matterSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Matter");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(matterSchema)
      .set(data)
      .where(eq(matterSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Matter with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(matterSchema)
      .where(eq(matterSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Matter with ID ${id} not found`, { id });
    }
  },
  async listAll() {
    const results = await db.query.matterSchema.findMany();
    return results;
  },
});
