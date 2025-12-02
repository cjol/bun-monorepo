import { useMemo } from "react";
import type { Matter } from "@ai-starter/core";

export type MetadataField =
  | {
      key: string;
      label: string;
      type: "string";
    }
  | {
      key: string;
      label: string;
      type: "number";
    }
  | {
      key: string;
      label: string;
      type: "enum";
      values: { name: string; value: string }[];
    };

/**
 * Custom hook to extract metadata field information from a matter's metadata schema.
 * Parses the simple schema format supporting string, number, and enum types.
 */
export function useMetadataFields(matter?: Matter): MetadataField[] {
  return useMemo(() => {
    if (!matter?.timeEntryMetadataSchema) {
      return [];
    }

    const schema = matter.timeEntryMetadataSchema;

    try {
      // The schema is a simple object with field definitions
      return Object.entries(schema).map(([key, fieldDef]) => {
        if (fieldDef.type === "enum") {
          return {
            key,
            label: fieldDef.name,
            type: "enum" as const,
            values: fieldDef.values,
          };
        }
        return {
          key,
          label: fieldDef.name,
          type: fieldDef.type,
        };
      });
    } catch (error) {
      console.error("Failed to parse metadata schema:", error);
      return [];
    }
  }, [matter]);
}
