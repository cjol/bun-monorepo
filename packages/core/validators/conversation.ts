import { z } from "zod";

export const conversationValidator = z.object({
  id: z.uuid(),
  title: z.string().min(1).max(255).nullable(),
  threadId: z.string().min(1).max(255).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
