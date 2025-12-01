import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { generateId } from "./utils/generateId";

export const fooSchema = sqliteTable("foo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  ...timestamps,
});

export type Foo = typeof fooSchema.$inferSelect;
export type NewFoo = typeof fooSchema.$inferInsert;
