import type { Workflow, NewWorkflow } from "../../schema";

export interface WorkflowRepository {
  get(id: string): Promise<Workflow | null>;
  listAll(): Promise<Workflow[]>;
  create(data: NewWorkflow): Promise<Workflow>;
  update(id: string, data: Partial<NewWorkflow>): Promise<Workflow>;
  delete(id: string): Promise<void>;
}
