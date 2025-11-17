import { z } from "zod";

export const timeEntryChangeLogValidator = z.object({
  id: z.uuid(),
  timeEntryId: z.uuid(),
  beforeData: z.record(z.string(), z.unknown()).nullable(),
  afterData: z.record(z.string(), z.unknown()),
  changedAt: z.date(),
});
