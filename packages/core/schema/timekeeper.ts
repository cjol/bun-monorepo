import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { matterSchema } from "./matter";
import { roleSchema } from "./role";

export const timekeeperSchema = sqliteTable("timekeeper", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roleSchema.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull(),
  ...timestamps,
});

export type Timekeeper = typeof timekeeperSchema.$inferSelect;
export type NewTimekeeper = typeof timekeeperSchema.$inferInsert;
