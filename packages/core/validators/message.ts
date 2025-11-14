import { z } from "zod";

export const messageRoleValidator = z.enum(["user", "assistant"]);

export const messageValidator = z.object({
  id: z.uuid(),
  conversationId: z.uuid(),
  role: messageRoleValidator,
  content: z.string().min(1),
  toolInvocations: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
