import { sqliteTable, text, customType } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { zerialize, dezerialize, type SzType, type ZodTypes } from "zodex";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

/**
 * Custom column type for time entry metadata schema.
 * Uses zodex to properly serialize/deserialize Zod schemas to/from a JSON format.
 * This allows round-trip conversion: Zod schema → serialized format → Zod schema.
 */
export const jsonTimeEntryMetadataSchema = customType<{
  data: ZodTypes | null;
  driverData: string;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: ZodTypes | null) {
    if (!value) return JSON.stringify(null);
    // Convert Zod schema to serialized format using zodex
    const serialized = zerialize(value);
    return JSON.stringify(serialized);
  },
  fromDriver(value: string) {
    const parsed = JSON.parse(value);
    if (!parsed) return null;
    // Reconstruct Zod schema from serialized format using zodex
    return dezerialize(parsed as SzType);
  },
});

export const matterSchema = sqliteTable("matter", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  clientName: text("client_name").notNull(),
  matterName: text("matter_name").notNull(),
  description: text("description"),
  timeEntryMetadataSchema: jsonTimeEntryMetadataSchema(
    "time_entry_metadata_schema"
  ).default(null),
  ...timestamps,
});

export type Matter = typeof matterSchema.$inferSelect;
export type NewMatter = typeof matterSchema.$inferInsert;

/**
 * Zod validation schemas for Matter entity.
 * Used for API input validation and sandbox function parameters.
 */

export const newMatterInputSchema = z.object({
  clientName: z.string().describe("Name of the client"),
  matterName: z.string().describe("Name of the matter"),
  description: z
    .string()
    .nullable()
    .describe("Optional description of the matter"),
  timeEntryMetadataSchema: z
    .any()
    .nullable()
    .optional()
    .describe(
      "Optional Zod schema defining the structure of time entry metadata for this matter"
    ),
});

export const updateMatterInputSchema = newMatterInputSchema.partial().extend({
  id: ulidSchema.describe("The ULID of the matter to update"),
});
