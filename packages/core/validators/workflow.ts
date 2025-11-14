import { z } from "zod";

export const workflowValidator = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(255),
  instructions: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});
