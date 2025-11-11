import { z } from "zod";

export const fooValidator = z.object({
  id: z.uuid(),
  createdAt: z.date().min(new Date(2025, 1, 1)),
});
