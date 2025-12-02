import { sqliteTable, text, customType } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

/**
 * Type definition for time entry metadata schema.
 * Simple format: Record<string, {type: "string" | "number", name: string}>
 */
export type TimeEntryMetadataSchema = Record<
  string,
  { type: "string" | "number"; name: string }
>;

/**
 * Custom column type for time entry metadata schema.
 * Stores a simple schema format as JSON.
 */
export const jsonTimeEntryMetadataSchema = customType<{
  data: TimeEntryMetadataSchema | null;
  driverData: string;
}>({
  dataType() {
    return "text";
  },
  toDriver(value: TimeEntryMetadataSchema | null) {
    if (!value) return JSON.stringify(null);
    return JSON.stringify(value);
  },
  fromDriver(value: string) {
    const parsed = JSON.parse(value);
    if (!parsed) return null;
    return parsed as TimeEntryMetadataSchema;
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

const metadataFieldSchema = z.object({
  type: z.enum(["string", "number"]).describe("The type of the metadata field"),
  name: z.string().describe("The display name of the metadata field"),
});

export const newMatterInputSchema = z.object({
  clientName: z.string().describe("Name of the client"),
  matterName: z.string().describe("Name of the matter"),
  description: z
    .string()
    .nullable()
    .describe("Optional description of the matter"),
  timeEntryMetadataSchema: z
    .record(z.string(), metadataFieldSchema)
    .nullable()
    .optional()
    .describe(
      "Optional schema defining the structure of time entry metadata for this matter. Format: Record<fieldKey, {type: 'string' | 'number', name: displayName}>"
    ),
});

export const updateMatterInputSchema = newMatterInputSchema.partial().extend({
  id: ulidSchema.describe("The ULID of the matter to update"),
});
