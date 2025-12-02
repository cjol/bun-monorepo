import type { RoleRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    role: RoleRepository;
  };
}

export const RoleService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getRole: repos.role.get,
    listRoles: repos.role.list,
    createRole: repos.role.create,
    updateRole: repos.role.update,
    deleteRole: repos.role.delete,
  };
};

export type RoleService = ReturnType<typeof RoleService>;
