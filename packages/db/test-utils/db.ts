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
