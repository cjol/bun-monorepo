import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { timekeeperSchema } from "./timekeeper";
import { matterSchema } from "./matter";

export const timekeeperRoleSchema = sqliteTable("timekeeper_role", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  timekeeperId: text("timekeeper_id")
    .notNull()
    .references(() => timekeeperSchema.id, { onDelete: "cascade" }),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  ...timestamps,
});

export type TimekeeperRole = typeof timekeeperRoleSchema.$inferSelect;
export type NewTimekeeperRole = typeof timekeeperRoleSchema.$inferInsert;
