import { roleSchema, type RoleRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleRoleRepository = ({ db }: Deps): RoleRepository => ({
  async get(id: string) {
    const result = await db.query.roleSchema.findFirst({
      where: eq(roleSchema.id, id),
    });
    return result ?? null;
  },
  async list() {
    const results = await db.query.roleSchema.findMany({
      orderBy: (roles, { asc }) => [asc(roles.name)],
    });
    return results;
  },
  async create(data) {
    const [result] = await db.insert(roleSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Role");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(roleSchema)
      .set(data)
      .where(eq(roleSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Role with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(roleSchema)
      .where(eq(roleSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Role with ID ${id} not found`, { id });
    }
  },
});
