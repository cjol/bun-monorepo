import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { matterSchema } from "./matter";
import { generateId } from "./utils/generateId";

export const workflowSchema = sqliteTable("workflow", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  instructions: text("instructions").notNull(),
  trigger: text("trigger").notNull(),
  ...timestamps,
});

export type Workflow = typeof workflowSchema.$inferSelect;
export type NewWorkflow = typeof workflowSchema.$inferInsert;

/**
 * Zod validation schemas for Workflow entity.
 * Used for API input validation and sandbox function parameters.
 */

import { z } from "zod";
import { ulidSchema } from "./utils/validation";

export const workflowTriggerSchema = z.enum([
  "time_entry:batch_created",
  // Additional triggers can be added here in the future
]);

export const newWorkflowInputSchema = z.object({
  matterId: ulidSchema.describe("The ULID of the matter"),
  name: z.string().describe("Name of the workflow"),
  instructions: z.string().describe("Natural language workflow instructions"),
  trigger: workflowTriggerSchema.describe(
    "The event that triggers this workflow"
  ),
});

export const updateWorkflowInputSchema = newWorkflowInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the workflow to update"),
  });
