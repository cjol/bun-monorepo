import { fooSchema } from "@ai-starter/core";
import type { DB } from "../../db";

export const seedNow = new Date("2024-01-01T00:00:00.000Z");

export const seedFoos = (db: DB) => {
  return db.insert(fooSchema).values([
    {
      id: "foo-1",
      name: "First Foo",
      createdAt: seedNow,
      updatedAt: seedNow,
    },
    {
      id: "foo-2",
      name: "Second Foo",
      createdAt: seedNow,
      updatedAt: seedNow,
    },
  ]);
};
