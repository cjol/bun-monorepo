import type { TimekeeperRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    timekeeper: TimekeeperRepository;
  };
}

export const TimekeeperService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimekeeper: repos.timekeeper.get,
    getTimekeeperByEmail: repos.timekeeper.getByEmail,
    createTimekeeper: repos.timekeeper.create,
    updateTimekeeper: repos.timekeeper.update,
    deleteTimekeeper: repos.timekeeper.delete,
    listAllTimekeepers: repos.timekeeper.listAll,
  };
};

export type TimekeeperService = ReturnType<typeof TimekeeperService>;
