import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";

export const documentTemplateSchema = sqliteTable("document_template", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  name: text("name").notNull(),
  description: text("description"),
  outputFormat: text("output_format", {
    enum: ["csv", "xlsx", "html", "json", "text"],
  })
    .notNull()
    .$default(() => "text"),
  dataSchema: text("data_schema").notNull(),
  templateCode: text("template_code").notNull(),
  ...timestamps,
});

export type DocumentTemplate = typeof documentTemplateSchema.$inferSelect;
export type NewDocumentTemplate = typeof documentTemplateSchema.$inferInsert;

/**
 * Zod validation schemas for DocumentTemplate entity.
 * Used for API input validation and sandbox function parameters.
 */

export const outputFormatSchema = z.enum([
  "csv",
  "xlsx",
  "html",
  "json",
  "text",
]);

export const newDocumentTemplateInputSchema = z.object({
  name: z.string().describe("Name of the document template"),
  description: z
    .string()
    .nullable()
    .describe("Optional description of the template"),
  outputFormat: outputFormatSchema.describe(
    "Output format of the generated document"
  ),
  dataSchema: z
    .string()
    .describe("JSON Schema string describing the expected input data"),
  templateCode: z
    .string()
    .describe("JavaScript code that generates the document content"),
});

export const updateDocumentTemplateInputSchema = newDocumentTemplateInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the document template to update"),
  });
