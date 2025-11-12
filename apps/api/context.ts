import { CoreAppService } from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";

export interface Context {
  app: ReturnType<typeof CoreAppService>;
}

export function getContext(database: string): Context {
  const db = getDB(database);
  const repos = getRepos(db);
  const app = CoreAppService({ repos });

  return { app };
}
