import { sqliteTable, text, customType } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

/**
 * Type definition for time entry metadata schema.
 * Simple format supporting string, number, and enum types.
 */
export type TimeEntryMetadataSchema = Record<
  string,
  | { type: "string"; name: string }
  | { type: "number"; name: string }
  | {
      type: "enum";
      name: string;
      values: { name: string; value: string }[];
    }
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

const metadataFieldSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("string"),
    name: z.string().describe("The display name of the metadata field"),
  }),
  z.object({
    type: z.literal("number"),
    name: z.string().describe("The display name of the metadata field"),
  }),
  z.object({
    type: z.literal("enum"),
    name: z.string().describe("The display name of the metadata field"),
    values: z
      .array(
        z.object({
          name: z.string().describe("Display name of the enum option"),
          value: z.string().describe("Value to store for the enum option"),
        })
      )
      .min(1)
      .describe("Array of possible enum values with name and value"),
  }),
]);

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
      "Optional schema defining the structure of time entry metadata for this matter. Format: Record<fieldKey, {type: 'string' | 'number' | 'enum', name: displayName, values?: {name: string, value: string}[]}>"
    ),
});

export const updateMatterInputSchema = newMatterInputSchema.partial().extend({
  id: ulidSchema.describe("The ULID of the matter to update"),
});
