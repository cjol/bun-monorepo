import { workflowSchema, type WorkflowRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleWorkflowRepository = ({
  db,
}: Deps): WorkflowRepository => ({
  async get(id: string) {
    const result = await db.query.workflowSchema.findFirst({
      where: eq(workflowSchema.id, id),
    });
    return result ?? null;
  },
  async create(data) {
    const [result] = await db.insert(workflowSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Workflow");
    return result;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(workflowSchema)
      .set(data)
      .where(eq(workflowSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Workflow with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(workflowSchema)
      .where(eq(workflowSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Workflow with ID ${id} not found`, { id });
    }
  },
  async listByMatter(matterId: string) {
    const results = await db.query.workflowSchema.findMany({
      where: eq(workflowSchema.matterId, matterId),
    });
    return results;
  },
});
