import type { DB } from "../db";
import { DrizzleFooRepository } from "./FooRepository";
import { DrizzleConversationRepository } from "./ConversationRepository";
import { DrizzleMessageRepository } from "./MessageRepository";
import { DrizzleMatterRepository } from "./MatterRepository";
import { DrizzleBillRepository } from "./BillRepository";
import { DrizzleTimeEntryRepository } from "./TimeEntryRepository";
import { DrizzleTimeEntryChangeLogRepository } from "./TimeEntryChangeLogRepository";
import { DrizzleAiSuggestionRepository } from "./AiSuggestionRepository";
import { DrizzleWorkflowRepository } from "./WorkflowRepository";
import { DrizzleTimekeeperRepository } from "./TimekeeperRepository";
import { DrizzleTimekeeperRoleRepository } from "./TimekeeperRoleRepository";

export * from "./FooRepository";
export * from "./ConversationRepository";
export * from "./MessageRepository";
export * from "./MatterRepository";
export * from "./BillRepository";
export * from "./TimeEntryRepository";
export * from "./TimeEntryChangeLogRepository";
export * from "./AiSuggestionRepository";
export * from "./WorkflowRepository";
export * from "./TimekeeperRepository";
export * from "./TimekeeperRoleRepository";

export const getRepos = (db: DB) => {
  return {
    foo: DrizzleFooRepository({ db }),
    conversation: DrizzleConversationRepository({ db }),
    message: DrizzleMessageRepository({ db }),
    matter: DrizzleMatterRepository({ db }),
    bill: DrizzleBillRepository({ db }),
    timeEntry: DrizzleTimeEntryRepository({ db }),
    timeEntryChangeLog: DrizzleTimeEntryChangeLogRepository({ db }),
    aiSuggestion: DrizzleAiSuggestionRepository({ db }),
    workflow: DrizzleWorkflowRepository({ db }),
    timekeeper: DrizzleTimekeeperRepository({ db }),
    timekeeperRole: DrizzleTimekeeperRoleRepository({ db }),
  };
};
