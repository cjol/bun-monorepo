import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";

export const timekeeperSchema = sqliteTable("timekeeper", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  ...timestamps,
});

export type Timekeeper = typeof timekeeperSchema.$inferSelect;
export type NewTimekeeper = typeof timekeeperSchema.$inferInsert;
