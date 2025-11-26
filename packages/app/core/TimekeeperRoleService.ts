import type { TimekeeperRoleRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    timekeeperRole: TimekeeperRoleRepository;
  };
}

export const TimekeeperRoleService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimekeeperRole: repos.timekeeperRole.get,
    createTimekeeperRole: repos.timekeeperRole.create,
    updateTimekeeperRole: repos.timekeeperRole.update,
    deleteTimekeeperRole: repos.timekeeperRole.delete,
    listByMatter: repos.timekeeperRole.listByMatter,
    listByTimekeeper: repos.timekeeperRole.listByTimekeeper,
  };
};

export type TimekeeperRoleService = ReturnType<typeof TimekeeperRoleService>;
