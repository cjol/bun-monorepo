import { useMemo } from "react";
import type { Matter } from "@ai-starter/core";

export interface MetadataField {
  key: string;
  label: string;
  type: "string" | "number";
}

/**
 * Custom hook to extract metadata field information from a matter's metadata schema.
 * Parses the simple schema format: Record<string, {type: "string" | "number", name: string}>
 */
export function useMetadataFields(matter?: Matter): MetadataField[] {
  return useMemo(() => {
    if (!matter?.timeEntryMetadataSchema) {
      return [];
    }

    const schema = matter.timeEntryMetadataSchema;

    try {
      // The schema is a simple object with field definitions
      return Object.entries(schema).map(([key, fieldDef]) => ({
        key,
        label: fieldDef.name,
        type: fieldDef.type,
      }));
    } catch (error) {
      console.error("Failed to parse metadata schema:", error);
      return [];
    }
  }, [matter]);
}
