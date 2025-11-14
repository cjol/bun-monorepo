import { workflowSchema } from "@ai-starter/core";
import type { DB } from "../../db";
import { seedNow } from "./foo";

export const mockWorkflows = [
  {
    id: "workflow-1",
    name: "Monthly Billing",
    instructions: "Generate bills for all matters at the end of each month",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
  {
    id: "workflow-2",
    name: "Time Entry Review",
    instructions: "Review all unbilled time entries and suggest improvements",
    createdAt: seedNow,
    updatedAt: seedNow,
  },
] as const;

export const doSeedWorkflows = (db: DB) => {
  return db.insert(workflowSchema).values([...mockWorkflows]);
};
