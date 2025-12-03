import { workflowSchema, type WorkflowRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { and, eq } from "drizzle-orm";
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
  async listByMatter(matterId: string) {
    return db.query.workflowSchema.findMany({
      where: eq(workflowSchema.matterId, matterId),
    });
  },
  async listByTrigger(matterId: string, trigger: string) {
    return db.query.workflowSchema.findMany({
      where: and(
        eq(workflowSchema.trigger, trigger),
        eq(workflowSchema.matterId, matterId)
      ),
    });
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
});
