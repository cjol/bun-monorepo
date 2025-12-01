import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { generateId } from "./utils/generateId";

export const conversationSchema = sqliteTable("conversation", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  title: text("title"),
  ...timestamps,
});

export type Conversation = typeof conversationSchema.$inferSelect;
export type NewConversation = typeof conversationSchema.$inferInsert;
