import {
  type WorkflowRepository,
  type Workflow,
  type NewWorkflow,
  workflowValidator,
} from "@ai-starter/core";

export interface Deps {
  repos: {
    workflow: WorkflowRepository;
  };
}

export const WorkflowService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getWorkflow: async (id: string): Promise<Workflow | null> => {
      return repos.workflow.get(id);
    },

    createWorkflow: async (data: {
      matterId: string;
      name: string;
      instructions: string;
    }): Promise<Workflow> => {
      const newWorkflow: NewWorkflow = {
        id: crypto.randomUUID(),
        matterId: data.matterId,
        name: data.name,
        instructions: data.instructions,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      workflowValidator.parse(newWorkflow);
      return repos.workflow.create(newWorkflow);
    },

    updateWorkflow: async (
      id: string,
      data: Partial<{
        name: string;
        instructions: string;
      }>
    ): Promise<Workflow> => {
      // Validate individual fields if provided
      if (data.name !== undefined) {
        workflowValidator.shape.name.parse(data.name);
      }
      if (data.instructions !== undefined) {
        workflowValidator.shape.instructions.parse(data.instructions);
      }

      return repos.workflow.update(id, {
        ...data,
        updatedAt: new Date(),
      });
    },

    deleteWorkflow: async (id: string): Promise<void> => {
      return repos.workflow.delete(id);
    },

    listByMatter: async (matterId: string): Promise<Workflow[]> => {
      return repos.workflow.listByMatter(matterId);
    },
  };
};

export type WorkflowService = ReturnType<typeof WorkflowService>;
