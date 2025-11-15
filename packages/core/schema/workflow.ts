import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { matterSchema } from "./matter";

export const workflowSchema = sqliteTable("workflow", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  instructions: text("instructions").notNull(),
  ...timestamps,
});

export type Workflow = typeof workflowSchema.$inferSelect;
export type NewWorkflow = typeof workflowSchema.$inferInsert;
