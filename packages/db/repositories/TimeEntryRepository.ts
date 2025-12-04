import { timeEntrySchema, type TimeEntryRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq, and } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleTimeEntryRepository = ({
  db,
}: Deps): TimeEntryRepository => ({
  async get(id: string) {
    const result = await db.query.timeEntrySchema.findFirst({
      where: eq(timeEntrySchema.id, id),
    });
    return result ?? null;
  },
  async createMany(data) {
    if (data.length === 0) return [];
    const results = await db.insert(timeEntrySchema).values(data).returning();
    if (!results || results.length !== data.length) {
      throw badImplementation("Failed to create TimeEntries");
    }
    return results;
  },
  async update(id: string, data) {
    const [result] = await db
      .update(timeEntrySchema)
      .set(data)
      .where(eq(timeEntrySchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`TimeEntry with ID ${id} not found`, { id });
    }
    return result;
  },
  async delete(id: string) {
    const [result] = await db
      .delete(timeEntrySchema)
      .where(eq(timeEntrySchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`TimeEntry with ID ${id} not found`, { id });
    }
  },
  async listByMatter(matterId: string) {
    const results = await db.query.timeEntrySchema.findMany({
      where: eq(timeEntrySchema.matterId, matterId),
    });
    return results;
  },
  async listByMatterAndBill(matterId: string, billId: string) {
    const results = await db.query.timeEntrySchema.findMany({
      where: and(
        eq(timeEntrySchema.matterId, matterId),
        eq(timeEntrySchema.billId, billId)
      ),
    });
    return results;
  },
});
