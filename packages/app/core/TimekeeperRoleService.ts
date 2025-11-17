import type {
  TimekeeperRoleRepository,
  TimekeeperRole,
  NewTimekeeperRole,
} from "@ai-starter/core";
import { timekeeperRoleValidator } from "@ai-starter/core";

export interface Deps {
  repos: {
    timekeeperRole: TimekeeperRoleRepository;
  };
}

export const TimekeeperRoleService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getTimekeeperRole: async (id: string): Promise<TimekeeperRole | null> => {
      return repos.timekeeperRole.get(id);
    },

    createTimekeeperRole: async (data: {
      timekeeperId: string;
      matterId: string;
      role: string;
    }): Promise<TimekeeperRole> => {
      const newRole: NewTimekeeperRole = {
        id: crypto.randomUUID(),
        timekeeperId: data.timekeeperId,
        matterId: data.matterId,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      timekeeperRoleValidator.parse(newRole);
      return repos.timekeeperRole.create(newRole);
    },

    updateTimekeeperRole: async (
      id: string,
      data: Partial<{
        role: string;
      }>
    ): Promise<TimekeeperRole> => {
      // Validate individual fields if provided
      if (data.role !== undefined) {
        timekeeperRoleValidator.shape.role.parse(data.role);
      }

      return repos.timekeeperRole.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    },

    deleteTimekeeperRole: async (id: string): Promise<void> => {
      return repos.timekeeperRole.delete(id);
    },

    listByMatter: async (matterId: string): Promise<TimekeeperRole[]> => {
      return repos.timekeeperRole.listByMatter(matterId);
    },

    listByTimekeeper: async (
      timekeeperId: string
    ): Promise<TimekeeperRole[]> => {
      return repos.timekeeperRole.listByTimekeeper(timekeeperId);
    },
  };
};

export type TimekeeperRoleService = ReturnType<typeof TimekeeperRoleService>;
