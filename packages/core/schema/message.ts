import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { timestamps } from "./utils/timestamps";
import { conversationSchema } from "./conversation";
import { generateId } from "./utils/generateId";

export const messageSchema = sqliteTable("message", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => conversationSchema.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["user", "assistant", "tool"] }).notNull(),
  content: text("content", { mode: "json" }).notNull().$type<MessageContent>(),
  ...timestamps,
});

// Message content types aligned with AI SDK's ModelMessage
export type MessageContent = MessagePart[];

export type MessagePart = TextPart | ToolCallPart | ToolResultPart;

export interface TextPart {
  type: "text";
  text: string;
}

export interface ToolCallPart {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  // N.B. this diverges from documentation but aligns with implementation
  input: unknown;
}

export interface ToolResultPart {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  output: ToolResultOutput;
}

export type ToolResultOutput =
  | { type: "text"; value: string }
  | { type: "json"; value: unknown }
  | { type: "error-text"; value: string }
  | { type: "error-json"; value: unknown }
  | {
      type: "content";
      value: (
        | {
            type: "text";

            /**
          Text content.
            */
            text: string;
          }
        | {
            type: "media";

            /**
          Base-64 encoded media data.
            */
            data: string;

            /**
          IANA media type.
          @see https://www.iana.org/assignments/media-types/media-types.xhtml
            */
            mediaType: string;
          }
      )[];
    };

export type Message = typeof messageSchema.$inferSelect;
export type NewMessage = typeof messageSchema.$inferInsert;
