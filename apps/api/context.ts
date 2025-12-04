import { CoreAppService } from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";
import { LocalFileStorage } from "@ai-starter/db";

export interface Context {
  app: ReturnType<typeof CoreAppService>;
}

export function getContext(database: string): Context {
  const db = getDB(database);
  const repos = getRepos(db);
  const storage = LocalFileStorage({ basePath: "./data/documents" });
  const app = CoreAppService({ repos, storage });

  return { app };
}
