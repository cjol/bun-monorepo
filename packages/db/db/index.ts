import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@ai-starter/core/schema";
import { pushSQLiteSchema } from "drizzle-kit/api";

export const getDB = (location: ":memory:" | (string & {}) = ":memory:") => {
  return drizzle(location, { schema, casing: "snake_case" });
};

export type DB = ReturnType<typeof getDB>;

export const migrateDB = async (db: DB) => {
  const { apply } = await pushSQLiteSchema(schema, db);
  await apply();
};
