import type { Conversation, NewConversation } from "../../schema";

export interface ConversationRepository {
  list(): Promise<Conversation[]>;
  get(id: string): Promise<Conversation | null>;
  getByThreadId(threadId: string): Promise<Conversation | null>;
  create(data: NewConversation): Promise<Conversation>;
  delete(id: string): Promise<void>;
}
