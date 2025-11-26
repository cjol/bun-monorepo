import type {
  TimekeeperRepository,
  Timekeeper,
  NewTimekeeper,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    timekeeper: TimekeeperRepository;
  };
}

export const TimekeeperService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimekeeper: async (id: string): Promise<Timekeeper | null> => {
      return repos.timekeeper.get(id);
    },

    getTimekeeperByEmail: async (email: string): Promise<Timekeeper | null> => {
      return repos.timekeeper.getByEmail(email);
    },

    createTimekeeper: async (data: NewTimekeeper): Promise<Timekeeper> => {
      return repos.timekeeper.create(data);
    },

    updateTimekeeper: async (
      id: string,
      data: Partial<NewTimekeeper>
    ): Promise<Timekeeper> => {
      return repos.timekeeper.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    },

    deleteTimekeeper: async (id: string): Promise<void> => {
      return repos.timekeeper.delete(id);
    },

    listAllTimekeepers: async (): Promise<Timekeeper[]> => {
      return repos.timekeeper.listAll();
    },
  };
};

export type TimekeeperService = ReturnType<typeof TimekeeperService>;
