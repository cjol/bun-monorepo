import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@ai-starter/core/schema";

export const getDB = (location: ":memory:" | (string & {}) = ":memory:") => {
  return drizzle(location, { schema, casing: "snake_case" });
};

export type DB = ReturnType<typeof getDB>;
