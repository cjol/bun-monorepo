import type { DB } from "../db";
import { DrizzleFooRepository } from "./FooRepository";

export * from "./FooRepository";

export const getRepos = (db: DB) => {
  return {
    foo: DrizzleFooRepository({ db }),
  };
};
