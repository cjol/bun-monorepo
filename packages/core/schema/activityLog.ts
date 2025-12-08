import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

export const activityLogSchema = sqliteTable("activity_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  type: text("type", { enum: ["agent_job", "reviewing_email"] }).notNull(),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .$default(() => "pending"),
  parameters: text("parameters", { mode: "json" }).$type<unknown>().notNull(),
  result: text("result", { mode: "json" }).$type<unknown>(),
  jobId: text("job_id"), // Foreign key to job table (nullable)
  assignedTo: text("assigned_to"), // Free-text field for human assignment (nullable)
  scheduledAt: integer("scheduled_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  startedAt: integer("started_at", { mode: "timestamp" }),
  finishedAt: integer("finished_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ActivityLog = typeof activityLogSchema.$inferSelect;
export type NewActivityLog = typeof activityLogSchema.$inferInsert;

/**
 * Zod validation schemas for ActivityLog entity.
 * Used for API input validation and service parameters.
 */

export const activityLogTypeSchema = z.enum(["agent_job", "reviewing_email"]);
export const activityLogStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

/** Parameters for agent_job activity type */
export const agentJobActivityParametersSchema = z.object({
  prompt: z.string().describe("The prompt sent to the agent"),
  matterId: ulidSchema.describe("The ULID of the matter"),
  workflowId: ulidSchema.describe("The ULID of the workflow"),
});

/** Parameters for reviewing_email activity type */
export const reviewingEmailActivityParametersSchema = z.object({
  to: z.string().email().describe("The recipient's email address"),
  subject: z.string().describe("The email subject line"),
  body: z.string().describe("The email body content"),
  messageId: z.string().describe("The email message ID"),
  timestamp: z.string().describe("When the email was sent"),
});

export const newActivityLogInputSchema = z.object({
  name: z.string().describe("The name of the activity"),
  type: activityLogTypeSchema.describe("The type of activity"),
  parameters: z
    .record(z.string(), z.unknown())
    .describe("Activity-specific parameters (structure varies by type)"),
  jobId: z
    .string()
    .optional()
    .describe("Optional job ID this activity is linked to"),
  assignedTo: z
    .string()
    .optional()
    .describe("Optional assignment to a human user"),
});
