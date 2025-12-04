import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { timestamps } from "./utils/timestamps";
import { ulidSchema } from "./utils/validation";
import { generateId } from "./utils/generateId";
import { matterSchema } from "./matter";
import { documentTemplateSchema } from "./documentTemplate";

export const documentSchema = sqliteTable("document", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => generateId()),
  matterId: text("matter_id")
    .notNull()
    .references(() => matterSchema.id, { onDelete: "cascade" }),
  templateId: text("template_id").references(() => documentTemplateSchema.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  mimeType: text("mime_type").notNull(),
  storagePath: text("storage_path").notNull(),
  fileSize: integer("file_size").notNull(),
  generatedBy: text("generated_by", {
    enum: ["agent", "user", "system"],
  })
    .notNull()
    .$default(() => "agent"),
  metadata: text("metadata", { mode: "json" }),
  ...timestamps,
});

export type Document = typeof documentSchema.$inferSelect;
export type NewDocument = typeof documentSchema.$inferInsert;

/**
 * Zod validation schemas for Document entity.
 * Used for API input validation and sandbox function parameters.
 */

export const generatedBySchema = z.enum(["agent", "user", "system"]);

export const newDocumentInputSchema = z.object({
  matterId: ulidSchema.describe("The ULID of the matter"),
  templateId: ulidSchema
    .nullable()
    .describe("The ULID of the template used (optional)"),
  name: z.string().describe("Name of the document"),
  mimeType: z.string().describe("MIME type of the document"),
  storagePath: z.string().describe("Storage path of the document file"),
  fileSize: z.number().describe("Size of the document in bytes"),
  generatedBy: generatedBySchema.describe("Who generated the document"),
  metadata: z
    .unknown()
    .nullable()
    .describe("Optional metadata about the document"),
});

export const updateDocumentInputSchema = newDocumentInputSchema
  .partial()
  .extend({
    id: ulidSchema.describe("The ULID of the document to update"),
  });
