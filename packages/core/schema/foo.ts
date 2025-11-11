import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const fooSchema = sqliteTable("foo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export type Foo = typeof fooSchema.$inferSelect;
export type NewFoo = typeof fooSchema.$inferInsert;
