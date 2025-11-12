import { fooSchema, type FooRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

export interface Deps {
  db: DB;
}

export const DrizzleFooRepository = ({ db }: Deps): FooRepository => ({
  async get(id: string) {
    const result = await db.query.fooSchema.findFirst({
      where: eq(fooSchema.id, id),
    });
    return result ?? null;
  },
  async create(data) {
    const [result] = await db.insert(fooSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Foo");
    return result;
  },
  async patch(id: string, name: string) {
    const [result] = await db
      .update(fooSchema)
      .set({ name })
      .where(eq(fooSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Foo with ID ${id} not found`, { id });
    }
    return result;
  },
});
