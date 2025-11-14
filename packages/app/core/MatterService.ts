import {
  type MatterRepository,
  type Matter,
  type NewMatter,
  matterValidator,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    matter: MatterRepository;
  };
}

export const MatterService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getMatter: async (id: string): Promise<Matter | null> => {
      return repos.matter.get(id);
    },

    createMatter: async (data: {
      clientName: string;
      matterName: string;
      description: string | null;
    }): Promise<Matter> => {
      const newMatter: NewMatter = {
        id: crypto.randomUUID(),
        clientName: data.clientName,
        matterName: data.matterName,
        description: data.description,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      matterValidator.parse(newMatter);
      return repos.matter.create(newMatter);
    },

    updateMatter: async (
      id: string,
      data: Partial<{
        clientName: string;
        matterName: string;
        description: string | null;
      }>
    ): Promise<Matter> => {
      // Validate individual fields if provided
      if (data.clientName !== undefined) {
        matterValidator.shape.clientName.parse(data.clientName);
      }
      if (data.matterName !== undefined) {
        matterValidator.shape.matterName.parse(data.matterName);
      }
      if (data.description !== undefined) {
        matterValidator.shape.description.parse(data.description);
      }

      return repos.matter.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    },

    deleteMatter: async (id: string): Promise<void> => {
      return repos.matter.delete(id);
    },
  };
};

export type MatterService = ReturnType<typeof MatterService>;
