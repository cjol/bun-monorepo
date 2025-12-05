import { CoreAppService } from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";
import { LocalFileStorage } from "@ai-starter/db";
import { join } from "node:path";

export interface Context {
  app: ReturnType<typeof CoreAppService>;
}

export function getContext(database: string): Context {
  const db = getDB(database);
  const repos = getRepos(db);

  const projectRoot = join(import.meta.dirname, "../..");
  const storage = LocalFileStorage({
    basePath: join(projectRoot, "data"),
  });
  const app = CoreAppService({ repos, storage });

  return { app };
}
