import type { DB } from "../db";
import { DrizzleFooRepository } from "./FooRepository";
import { DrizzleConversationRepository } from "./ConversationRepository";
import { DrizzleMessageRepository } from "./MessageRepository";

export * from "./FooRepository";
export * from "./ConversationRepository";
export * from "./MessageRepository";

export const getRepos = (db: DB) => {
  return {
    foo: DrizzleFooRepository({ db }),
    conversation: DrizzleConversationRepository({ db }),
    message: DrizzleMessageRepository({ db }),
  };
};
