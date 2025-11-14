import { getDB, migrateDB } from "../db";
import {
  DrizzleFooRepository,
  DrizzleConversationRepository,
  DrizzleMessageRepository,
  DrizzleMatterRepository,
  DrizzleBillRepository,
  DrizzleTimeEntryRepository,
  DrizzleTimeEntryChangeLogRepository,
  DrizzleAiSuggestionRepository,
  DrizzleWorkflowRepository,
} from "../repositories";
import { doSeedAll } from "./seed/all";

export const testDB = async (opts: { seed?: boolean } = {}) => {
  const { seed = true } = opts;
  // Use file::memory: with mode=memory to ensure proper isolation between test databases
  // Each call creates a truly unique in-memory database
  const db = getDB(`file::memory:?cache=private`);
  await migrateDB(db);
  if (seed) await doSeedAll(db);
  return db;
};

export const getRepos = async () => {
  const db = await testDB();
  return {
    db,
    repos: {
      foo: DrizzleFooRepository({ db }),
      conversation: DrizzleConversationRepository({ db }),
      message: DrizzleMessageRepository({ db }),
      matter: DrizzleMatterRepository({ db }),
      bill: DrizzleBillRepository({ db }),
      timeEntry: DrizzleTimeEntryRepository({ db }),
      timeEntryChangeLog: DrizzleTimeEntryChangeLogRepository({ db }),
      aiSuggestion: DrizzleAiSuggestionRepository({ db }),
      workflow: DrizzleWorkflowRepository({ db }),
    },
  };
};
