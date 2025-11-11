import { CoreAppService } from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";

export const getApp = async (database: string) => {
  const db = getDB(database);
  const repos = getRepos(db);

  return CoreAppService({ repos });
};
