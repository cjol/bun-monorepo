import { z } from "zod";

export const rateValidator = z.object({
  matterId: z.string().uuid("Matter ID must be a valid UUID"),
  roleId: z.string().uuid("Role ID must be a valid UUID"),
  hourlyRate: z.number().positive("Hourly rate must be positive"),
});
