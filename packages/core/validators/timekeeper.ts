import { z } from "zod";

export const timekeeperValidator = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
