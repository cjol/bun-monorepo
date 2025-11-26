import { type WorkflowRepository } from "@ai-starter/core";

export interface Deps {
  repos: {
    workflow: WorkflowRepository;
  };
}

export const WorkflowService = (deps: Deps) => {
  const { repos } = deps;

  return {
    getWorkflow: repos.workflow.get,
    createWorkflow: repos.workflow.create,
    updateWorkflow: repos.workflow.update,
    deleteWorkflow: repos.workflow.delete,
    listByMatter: repos.workflow.listByMatter,
  };
};

export type WorkflowService = ReturnType<typeof WorkflowService>;
