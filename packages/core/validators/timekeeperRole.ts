import { z } from "zod";

export const timekeeperRoleValidator = z.object({
  id: z.string().uuid().optional(),
  timekeeperId: z.string().uuid(),
  matterId: z.string().uuid(),
  role: z.string().min(1),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});
