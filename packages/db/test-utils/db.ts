import { getDB } from "../db";
import { pushSQLiteSchema } from "drizzle-kit/api";
import * as schema from "@ai-starter/core/schema";
import { DrizzleFooRepository } from "../repositories";

export const testDB = async () => {
  const db = getDB(":memory:");
  const { apply } = await pushSQLiteSchema(schema, db);
  await apply();

  return db;
};

export const getRepos = async () => {
  const db = await testDB();
  return {
    db,
    repos: {
      foo: DrizzleFooRepository({ db }),
    },
  };
};
