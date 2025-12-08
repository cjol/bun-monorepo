import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

export const jobSchema = sqliteTable("job", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  type: text("type", { enum: ["agent"] }).notNull(),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .$default(() => "pending"),
  parameters: text("parameters", { mode: "json" }).$type<unknown>().notNull(),
  result: text("result", { mode: "json" }).$type<unknown>(),
  scheduledAt: integer("scheduled_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
});

export type Job = typeof jobSchema.$inferSelect;
export type NewJob = typeof jobSchema.$inferInsert;

/**
 * Zod validation schemas for Job entity.
 * Used for API input validation and service parameters.
 */

export const jobTypeSchema = z.enum(["agent"]);
export const jobStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

/** Parameters for agent job type */
export const agentJobParametersSchema = z.object({
  prompt: z.string().describe("The prompt to send to the agent"),
  matterId: ulidSchema.describe("The ULID of the matter"),
  workflowId: ulidSchema.describe("The ULID of the workflow"),
});

export const newJobInputSchema = z.object({
  name: z.string().describe("The name of the job"),
  type: jobTypeSchema.describe("The type of job to create"),
  parameters: z
    .record(z.string(), z.unknown())
    .describe("Job-specific parameters (structure varies by type)"),
});
