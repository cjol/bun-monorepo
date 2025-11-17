import { z } from "zod";

export const billStatusValidator = z.enum([
  "draft",
  "finalized",
  "sent",
  "paid",
]);

export const billValidator = z.object({
  id: z.uuid(),
  matterId: z.uuid(),
  periodStart: z.date(),
  periodEnd: z.date(),
  status: billStatusValidator,
  createdAt: z.date(),
  updatedAt: z.date(),
});
