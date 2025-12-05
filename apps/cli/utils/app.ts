import {
  CoreAppService,
  AiAgentService,
  createGeneralPurposeAgent,
} from "@ai-starter/app";
import { getDB, getRepos, LocalFileStorage } from "@ai-starter/db";
import { join } from "node:path";

export const getApp = async (repos: ReturnType<typeof getRepos>) => {
  const projectRoot = join(import.meta.dirname, "../../..");
  const storage = LocalFileStorage({
    basePath: join(projectRoot, "data"),
  });
  return CoreAppService({ repos, storage });
};

export const getAgent = async (repos: ReturnType<typeof getRepos>) => {
  const app = await getApp(repos);
  return AiAgentService({
    coreService: app,
    repos,
    agent: createGeneralPurposeAgent({
      services: app,
    }),
  });
};

export const getContext = async (databaseUrl?: string) => {
  const db = await getDB(databaseUrl);
  const repos = await getRepos(db);
  const app = await getApp(repos);
  const agent = await getAgent(repos);
  return { repos, app, agent };
};
