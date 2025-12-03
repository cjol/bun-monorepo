import { jobSchema, type JobRepository } from "@ai-starter/core";
import type { DB } from "../db";
import { eq, asc } from "drizzle-orm";
import { notFound, badImplementation } from "@hapi/boom";

interface Deps {
  db: DB;
}

export const DrizzleJobRepository = ({ db }: Deps): JobRepository => ({
  async get(id: string) {
    const result = await db.query.jobSchema.findFirst({
      where: eq(jobSchema.id, id),
    });
    return result;
  },

  async list() {
    return db.query.jobSchema.findMany({
      orderBy: [asc(jobSchema.scheduledAt)],
    });
  },

  async listPending() {
    return db.query.jobSchema.findMany({
      where: eq(jobSchema.status, "pending"),
      orderBy: [asc(jobSchema.scheduledAt)],
    });
  },

  async claimNext() {
    // Get the next pending job
    const pending = await db.query.jobSchema.findFirst({
      where: eq(jobSchema.status, "pending"),
      orderBy: [asc(jobSchema.scheduledAt)],
    });

    if (!pending) return undefined;

    // Atomically update it to running
    const [result] = await db
      .update(jobSchema)
      .set({
        status: "running",
        startedAt: new Date(),
      })
      .where(eq(jobSchema.id, pending.id))
      .returning();

    if (!result) throw badImplementation("Failed to claim job");
    return result;
  },

  async create(data: Parameters<JobRepository["create"]>[0]) {
    const [result] = await db.insert(jobSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Job");
    return result;
  },

  async update(id: string, data: Parameters<JobRepository["update"]>[1]) {
    const [result] = await db
      .update(jobSchema)
      .set(data)
      .where(eq(jobSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Job with ID ${id} not found`, { id });
    }
    return result;
  },

  async delete(id: string) {
    const [result] = await db
      .delete(jobSchema)
      .where(eq(jobSchema.id, id))
      .returning();
    if (!result) {
      throw notFound(`Job with ID ${id} not found`, { id });
    }
  },
});
