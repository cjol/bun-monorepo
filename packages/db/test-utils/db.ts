import { getDB, seedDB, type DB } from "../db";
import { DrizzleFooRepository } from "../repositories";

export const testDB = async () => {
  const db = getDB(":memory:");
  await seedDB(db);
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
