import { z } from "zod";

export const matterValidator = z.object({
  id: z.uuid(),
  clientName: z.string().min(1).max(255),
  matterName: z.string().min(1).max(255),
  description: z.string().max(1000).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
