import { sqliteTable, text, uniqueIndex, index } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";
import { jobSchema } from "./job";

export const jobEntitySchema = sqliteTable(
  "job_entity",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => generateId()),
    jobId: text("job_id")
      .notNull()
      .references(() => jobSchema.id, { onDelete: "cascade" }),
    entityType: text("entity_type", {
      enum: ["time_entry"],
    }).notNull(),
    entityId: text("entity_id").notNull(),
    ...timestamps,
  },
  (table) => ({
    // Prevent duplicate links between a job and the same entity
    uniqueJobEntity: uniqueIndex("unique_job_entity").on(
      table.jobId,
      table.entityType,
      table.entityId
    ),
    // Index for efficient reverse lookups (find all jobs for an entity)
    entityLookup: index("entity_lookup").on(table.entityType, table.entityId),
  })
);

export type JobEntity = typeof jobEntitySchema.$inferSelect;
export type NewJobEntity = typeof jobEntitySchema.$inferInsert;

/**
 * Zod validation schemas for JobEntity.
 * Used for API input validation and service parameters.
 */

export const jobEntityTypeSchema = z.enum(["time_entry"]);

export const newJobEntityInputSchema = z.object({
  jobId: ulidSchema.describe("The ULID of the job"),
  entityType: jobEntityTypeSchema.describe("The type of entity being linked"),
  entityId: ulidSchema.describe("The ULID of the entity"),
});

/** Input schema for creating job with linked entities */
export const jobEntityLinkSchema = z.object({
  entityType: jobEntityTypeSchema.describe("The type of entity being linked"),
  entityId: ulidSchema.describe("The ULID of the entity"),
});
