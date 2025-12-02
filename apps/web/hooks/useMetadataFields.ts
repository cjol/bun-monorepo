import { useMemo } from "react";
import type { Matter } from "@ai-starter/core";

export interface MetadataField {
  key: string;
  label: string;
  description?: string;
}

/**
 * Custom hook to extract metadata field information from a matter's Zod schema.
 * Parses the schema to get field names and descriptions.
 */
export function useMetadataFields(matter?: Matter): MetadataField[] {
  return useMemo(() => {
    if (!matter?.timeEntryMetadataSchema) {
      return [];
    }

    const schema = matter.timeEntryMetadataSchema;

    try {
      // Zod schemas store their shape in _def or directly as .shape
      // We use type assertions here to access internal Zod structure
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const zodInternal = schema as any;

      // Try to get the shape from the schema
      const shape = zodInternal.shape || zodInternal._def?.shape?.();

      if (shape && typeof shape === "object") {
        return extractFieldsFromShape(shape);
      }

      // Fallback: if we can't parse the schema, return empty array
      return [];
    } catch (error) {
      console.error("Failed to parse metadata schema:", error);
      return [];
    }
  }, [matter]);
}

/**
 * Helper function to extract field information from a Zod object shape.
 */
function extractFieldsFromShape(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shape: Record<string, any>
): MetadataField[] {
  const fields: MetadataField[] = [];

  for (const [key, fieldSchema] of Object.entries(shape)) {
    // Try to get the description from the schema
    const description = fieldSchema?._def?.description || undefined;

    // Use description as label if available, otherwise use the key with proper casing
    const label = description || formatFieldKey(key);

    fields.push({
      key,
      label,
      description,
    });
  }

  return fields;
}

/**
 * Convert a camelCase or snake_case key to a human-readable label.
 */
function formatFieldKey(key: string): string {
  // Convert snake_case to spaces
  let formatted = key.replace(/_/g, " ");

  // Add spaces before capital letters in camelCase
  formatted = formatted.replace(/([a-z])([A-Z])/g, "$1 $2");

  // Capitalize first letter of each word
  formatted = formatted
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return formatted;
}
