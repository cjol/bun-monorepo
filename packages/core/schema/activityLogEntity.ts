import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { generateId } from "./utils/generateId";

export const activityLogEntitySchema = sqliteTable("activity_log_entity", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  activityLogId: text("activity_log_id").notNull(),
  entityType: text("entity_type", { enum: ["time_entry"] }).notNull(),
  entityId: text("entity_id").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type ActivityLogEntity = typeof activityLogEntitySchema.$inferSelect;
export type NewActivityLogEntity = typeof activityLogEntitySchema.$inferInsert;

/**
 * Zod validation schemas for ActivityLogEntity junction table.
 */

export const activityLogEntityTypeSchema = z.enum(["time_entry"]);

export const newActivityLogEntityInputSchema = z.object({
  activityLogId: z.string().describe("The ID of the activity log"),
  entityType: activityLogEntityTypeSchema.describe("The type of entity"),
  entityId: z.string().describe("The ID of the entity"),
});
