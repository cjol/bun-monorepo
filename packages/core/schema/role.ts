import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { generateId } from "./utils/generateId";

export const roleSchema = sqliteTable("role", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  description: text("description"),
  ...timestamps,
});

export type Role = typeof roleSchema.$inferSelect;
export type NewRole = typeof roleSchema.$inferInsert;
