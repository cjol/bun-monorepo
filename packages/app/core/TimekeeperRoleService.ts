import type {
  TimekeeperRoleRepository,
  TimekeeperRepository,
  RoleRepository,
  TimekeeperRole,
  Timekeeper,
  Role,
} from "@ai-starter/core";
import { notFound } from "@hapi/boom";

export interface Deps {
  repos: {
    timekeeperRole: TimekeeperRoleRepository;
    timekeeper: TimekeeperRepository;
    role: RoleRepository;
  };
}

export interface EnrichedTimekeeperRole {
  timekeeperRole: TimekeeperRole;
  timekeeper: Timekeeper;
  role: Role;
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

    /**
     * Get all timekeeper roles for a matter with enriched timekeeper and role details.
     * Useful for displaying comprehensive team information.
     */
    getEnrichedTimekeeperRolesByMatter: async (
      matterId: string
    ): Promise<EnrichedTimekeeperRole[]> => {
      const timekeeperRoles = await repos.timekeeperRole.listByMatter(matterId);

      const enriched = await Promise.all(
        timekeeperRoles.map(async (timekeeperRole) => {
          const timekeeper = await repos.timekeeper.get(
            timekeeperRole.timekeeperId
          );
          const role = await repos.role.get(timekeeperRole.roleId);

          if (!timekeeper) {
            throw notFound(
              `Timekeeper ${timekeeperRole.timekeeperId} not found`
            );
          }
          if (!role) {
            throw notFound(`Role ${timekeeperRole.roleId} not found`);
          }

          return {
            timekeeperRole,
            timekeeper,
            role,
          };
        })
      );

      return enriched;
    },
  };
};

export type TimekeeperRoleService = ReturnType<typeof TimekeeperRoleService>;
