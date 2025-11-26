import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";

export const matterSchema = sqliteTable("matter", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  clientName: text("client_name").notNull(),
  matterName: text("matter_name").notNull(),
  description: text("description"),
  ...timestamps,
});

export type Matter = typeof matterSchema.$inferSelect;
export type NewMatter = typeof matterSchema.$inferInsert;
