import {
  documentTemplateSchema,
  type DocumentTemplateRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleDocumentTemplateRepository = ({
  db,
}: Deps): DocumentTemplateRepository => ({
  async get(id: string) {
    const result = await db.query.documentTemplateSchema.findFirst({
      where: eq(documentTemplateSchema.id, id),
    });
    return result ?? null;
  },
  async listAll() {
    return db.query.documentTemplateSchema.findMany();
  },
  async create(data) {
    const [result] = await db
      .insert(documentTemplateSchema)
      .values(data)
      .returning();
    if (!result) throw badImplementation("Failed to create DocumentTemplate");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(documentTemplateSchema)
      .set(data)
      .where(eq(documentTemplateSchema.id, id))
      .returning();
    if (!result)
      throw notFound(`DocumentTemplate with ID ${id} not found`, { id });
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(documentTemplateSchema)
      .where(eq(documentTemplateSchema.id, id))
      .returning();
    if (!result)
      throw notFound(`DocumentTemplate with ID ${id} not found`, { id });
  },
});
