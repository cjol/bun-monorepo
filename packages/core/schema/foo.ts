import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";

export const fooSchema = sqliteTable("foo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  ...timestamps,
});

export type Foo = typeof fooSchema.$inferSelect;
export type NewFoo = typeof fooSchema.$inferInsert;
