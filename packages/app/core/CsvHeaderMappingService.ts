import { generateObject, type LanguageModel } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { Matter } from "@ai-starter/core";
import {
  newTimeEntryInputSchema,
  buildZodMetadataFieldSchema,
} from "@ai-starter/core";

/**
 * Schema for the CSV header mapping result
 */
export const csvHeaderMappingSchema = z.object({
  mapping: z
    .record(z.string(), z.string())
    .describe("Map of CSV headers to time entry fields"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score of the mapping"),
  notes: z.string().optional().describe("Additional notes about the mapping"),
  unsupportedHeaders: z
    .array(z.string())
    .optional()
    .describe("Headers that couldn't be mapped"),
});

export type CsvHeaderMappingResult = z.infer<typeof csvHeaderMappingSchema>;

export interface Deps {
  model?: LanguageModel;
}

/**
 * Get fallback mapping using pattern matching
 */
const getFallbackMapping = (csvHeaders: string[]): CsvHeaderMappingResult => {
  const fallbackMapping: Record<string, string> = {};
  const unsupportedHeaders: string[] = [];

  for (const header of csvHeaders) {
    const normalizedHeader = header.toLowerCase().trim();

    // Basic pattern matching for common headers
    if (
      normalizedHeader.includes("date") ||
      normalizedHeader.includes("work_date")
    ) {
      fallbackMapping[header] = "date";
    } else if (
      normalizedHeader.includes("timekeeper") ||
      normalizedHeader.includes("fee-earner") ||
      normalizedHeader.includes("lawyer") ||
      normalizedHeader.includes("attorney") ||
      normalizedHeader.includes("staff") ||
      normalizedHeader.includes("employee")
    ) {
      fallbackMapping[header] = "timekeeperName";
    } else if (
      normalizedHeader.includes("hour") ||
      normalizedHeader.includes("hrs") ||
      normalizedHeader.includes("duration")
    ) {
      fallbackMapping[header] = "hours";
    } else if (
      normalizedHeader.includes("description") ||
      normalizedHeader.includes("notes") ||
      normalizedHeader.includes("task") ||
      normalizedHeader.includes("activity")
    ) {
      fallbackMapping[header] = "description";
    } else if (
      normalizedHeader.includes("bill") ||
      normalizedHeader.includes("invoice")
    ) {
      fallbackMapping[header] = "billId";
    } else {
      unsupportedHeaders.push(header);
    }
  }

  return {
    mapping: fallbackMapping,
    confidence: 0.9,
    notes: "AI mapping unavailable, used basic pattern matching as fallback",
    unsupportedHeaders:
      unsupportedHeaders.length > 0 ? unsupportedHeaders : undefined,
  };
};

/**
 * Service for mapping CSV headers to time entry fields using AI
 */
export const CsvHeaderMappingService = (deps: Deps = {}) => {
  const model = deps.model || anthropic("claude-haiku-4-5");

  /**
   * Generate a mapping from CSV headers to time entry fields
   */
  const mapCsvHeaders = async (
    csvHeaders: string[],
    matter: Matter
  ): Promise<CsvHeaderMappingResult> => {
    // Define the time entry fields that can be mapped
    const schema = newTimeEntryInputSchema(
      buildZodMetadataFieldSchema(matter.timeEntryMetadataSchema)
    )
      .omit({
        matterId: true,
        timekeeperId: true,
        metadata: !matter.timeEntryMetadataSchema || undefined,
      })
      .extend({
        timekeeperName: z.string().describe("Name of the timekeeper"),
      });
    const prompt = `You are helping to map CSV column headers to time entry fields for a legal timesheet system.

**Matter Information:**
- Client: ${matter.clientName}
- Matter: ${matter.matterName}
- Description: ${matter.description || "No description"}

**Time Entry Schema**
\`\`\`json-schema
${JSON.stringify(z.toJSONSchema(schema), null, 2)}
\`\`\`
}

**CSV Headers to Map:**
${csvHeaders.map((header) => `- "${header}"`).join("\n")}

**Instructions:**
1. Analyze each CSV header and determine which time entry field it corresponds to
2. Be flexible - headers like "fee-earner" should map to "timekeeperName", "date" to "date", etc.
3. Metadata fields should be mapped as \`metadata.fieldName\` only if they are present in the schema. Do not map any fields that are not in the schema.
4. Consider the context of legal timesheets when making mapping decisions
5. Only map headers that clearly correspond to available fields
6. Provide a confidence score (0-1) for how confident you are in the overall mapping
7. Include notes about any ambiguous mappings or decisions made
8. List any headers that couldn't be mapped to available fields

**Response Format:**
Return a JSON object with the mapping, confidence score, notes, and any unsupported headers.`;

    try {
      const result = await generateObject({
        model,
        prompt,
        schema: csvHeaderMappingSchema,
        temperature: 0.1, // Lower temperature for more consistent mapping
      });

      return result.object;
    } catch (error) {
      console.error("Error mapping CSV headers:", error);
      return getFallbackMapping(csvHeaders);
    }
  };

  return {
    mapCsvHeaders,
  };
};

export type CsvHeaderMappingService = ReturnType<
  typeof CsvHeaderMappingService
>;
