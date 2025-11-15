import { z } from "zod";

export const workflowValidator = z.object({
  id: z.string().uuid().optional(),
  matterId: z.string().uuid(),
  name: z.string().min(1),
  instructions: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
