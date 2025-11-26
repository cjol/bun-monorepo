import { sqliteTable, text, real } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { matterSchema } from "./matter";
import { roleSchema } from "./role";

export const rateSchema = sqliteTable("rate", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  roleId: text("role_id")
    .notNull()
    .references(() => roleSchema.id, { onDelete: "cascade" }),
  hourlyRate: real("hourly_rate").notNull(),
  ...timestamps,
});

export type Rate = typeof rateSchema.$inferSelect;
export type NewRate = typeof rateSchema.$inferInsert;
