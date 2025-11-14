import type { Message, NewMessage } from "../../schema";

export interface MessageRepository {
  listByConversation(conversationId: string): Promise<Message[]>;
  create(data: NewMessage): Promise<Message>;
}
