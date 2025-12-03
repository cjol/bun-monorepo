import {
  jobSchema,
  jobEntitySchema,
  type JobRepository,
} from "@ai-starter/core";
import type { DB } from "../db";
import { eq, asc, and } from "drizzle-orm";
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

  async create(
    data: Parameters<JobRepository["create"]>[0],
    entities?: Parameters<JobRepository["create"]>[1]
  ) {
    const [result] = await db.insert(jobSchema).values(data).returning();
    if (!result) throw badImplementation("Failed to create Job");

    // Link entities if provided
    if (entities && entities.length > 0) {
      await db.insert(jobEntitySchema).values(
        entities.map((entity) => ({
          jobId: result.id,
          entityType: entity.entityType as "time_entry",
          entityId: entity.entityId,
        }))
      );
    }

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

  async listEntitiesByJob(jobId: string) {
    return db.query.jobEntitySchema.findMany({
      where: eq(jobEntitySchema.jobId, jobId),
    });
  },

  async listJobsByEntity(entityType: string, entityId: string) {
    return db.query.jobEntitySchema.findMany({
      where: and(
        eq(jobEntitySchema.entityType, entityType as "time_entry"),
        eq(jobEntitySchema.entityId, entityId)
      ),
    });
  },
});
