import { fooSchema, type FooRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";

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
    return result!;
  },
  async patch(id: string, name: string) {
    const [result] = await db
      .update(fooSchema)
      .set({ name })
      .where(eq(fooSchema.id, id))
      .returning();
    return result!;
  },
});
