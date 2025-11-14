import { getDB, migrateDB } from "../db";
import {
  DrizzleFooRepository,
  DrizzleConversationRepository,
  DrizzleMessageRepository,
} from "../repositories";
import { doSeedAll } from "./seed/all";

export const testDB = async (opts: { seed?: boolean } = {}) => {
  const { seed = true } = opts;
  const db = getDB(":memory:");
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
    },
  };
};
