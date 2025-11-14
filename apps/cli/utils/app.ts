import { CoreAppService, AiAgentService } from "@ai-starter/app";
import { getDB, getRepos } from "@ai-starter/db";

export const getApp = async (repos: ReturnType<typeof getRepos>) => {
  return CoreAppService({ repos });
};

export const getAgent = async (repos: ReturnType<typeof getRepos>) => {
  const app = await getApp(repos);
  return AiAgentService({ coreService: app, repos });
};

export const getContext = async (databaseUrl?: string) => {
  const db = await getDB(databaseUrl);
  const repos = await getRepos(db);
  const app = await getApp(repos);
  const agent = await getAgent(repos);
  return { repos, app, agent };
};
