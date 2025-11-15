import { z } from "zod";

export const timeEntryValidator = z.object({
  id: z.uuid(),
  matterId: z.uuid(),
  timekeeperId: z.uuid(),
  billId: z.uuid().nullable(),
  date: z.date(),
  hours: z.number().positive().max(24),
  description: z.string().min(1).max(1000),
  createdAt: z.date(),
  updatedAt: z.date(),
});
