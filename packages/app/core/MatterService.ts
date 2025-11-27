import { type MatterRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    matter: MatterRepository;
  };
}

export const MatterService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getMatter: repos.matter.get,
    listMatters: repos.matter.listAll,
    createMatter: repos.matter.create,
    updateMatter: repos.matter.update,
    deleteMatter: repos.matter.delete,
  };
};

export type MatterService = ReturnType<typeof MatterService>;
