import type {
  TimekeeperRepository,
  Timekeeper,
  NewTimekeeper,
} from "@ai-starter/core";
import { timekeeperValidator } from "@ai-starter/core";

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

    createTimekeeper: async (data: {
      name: string;
      email: string;
    }): Promise<Timekeeper> => {
      const newTimekeeper: NewTimekeeper = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      timekeeperValidator.parse(newTimekeeper);
      return repos.timekeeper.create(newTimekeeper);
    },

    updateTimekeeper: async (
      id: string,
      data: Partial<{
        name: string;
        email: string;
      }>
    ): Promise<Timekeeper> => {
      // Validate individual fields if provided
      if (data.name !== undefined) {
        timekeeperValidator.shape.name.parse(data.name);
      }
      if (data.email !== undefined) {
        timekeeperValidator.shape.email.parse(data.email);
      }

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
