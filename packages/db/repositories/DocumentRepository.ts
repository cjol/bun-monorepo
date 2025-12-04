import { documentSchema, type DocumentRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleDocumentRepository = ({
  db,
}: Deps): DocumentRepository => ({
  async get(id: string) {
    const result = await db.query.documentSchema.findFirst({
      where: eq(documentSchema.id, id),
    });
    return result ?? null;
  },
  async listByMatter(matterId: string) {
    return db.query.documentSchema.findMany({
      where: eq(documentSchema.matterId, matterId),
      orderBy: (documents, { desc }) => [desc(documents.createdAt)],
    });
  },
  async create(data) {
    const [result] = await db.insert(documentSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Document");
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(documentSchema)
      .where(eq(documentSchema.id, id))
      .returning();
    if (!result) throw notFound(`Document with ID ${id} not found`, { id });
  },
});
