import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";

export const conversationSchema = sqliteTable("conversation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  title: text("title"),
  ...timestamps,
});

export type Conversation = typeof conversationSchema.$inferSelect;
export type NewConversation = typeof conversationSchema.$inferInsert;
