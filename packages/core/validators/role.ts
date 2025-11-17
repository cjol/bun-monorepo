import { z } from "zod";

export const roleValidator = z.object({
  name: z.string().min(1, "Role name is required"),
  description: z.string().optional(),
});
