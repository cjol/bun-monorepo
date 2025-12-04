import { evalite } from "evalite";
import {
  testDB,
  createTimeTrackingTestContext,
  type TimeTrackingTestContext,
} from "@ai-starter/db/test-utils";
import { CsvHeaderMappingService } from "./CsvHeaderMappingService";
import type { Matter } from "@ai-starter/core";

/**
 * Shared setup function to create database, context, and service for each test
 */
async function setupTest(options?: {
  matterOverrides?: {
    clientName?: string;
    matterName?: string;
    description?: string;
    timeEntryMetadataSchema?: Matter["timeEntryMetadataSchema"];
  };
}) {
  const db = await testDB({ seed: false });
  const context = await createTimeTrackingTestContext(db, {
    seedRoles: true,
    withBill: true,
    matterOverrides: options?.matterOverrides,
  });

  const service = CsvHeaderMappingService();

  return { db, context, service };
}

/**
 * Helper to create a matter with metadata schema for testing
 */
function createMatterWithMetadata(
  baseContext: TimeTrackingTestContext,
  metadataSchema: Matter["timeEntryMetadataSchema"]
): Matter {
  return {
    ...baseContext.matter,
    timeEntryMetadataSchema: metadataSchema,
  };
}

interface InputFormat {
  headers: string[];
  expectedMappings?: Record<string, string>;
  expectedUnsupportedHeaders?: string[];
  expectedConfidenceRange?: [number, number];
  metadataSchema?: Matter["timeEntryMetadataSchema"];
}

evalite("CSV Header Mapping", {
  data: [
    // Basic header mapping scenarios
    {
      input: {
        headers: ["Fee Earner", "Date", "Hours", "Description", "Task Code"],
        expectedMappings: {
          "Fee Earner": "timekeeperName",
          Date: "date",
          Hours: "hours",
          Description: "description",
        },
        expectedUnsupportedHeaders: ["Task Code"],
        expectedConfidenceRange: [0.5, 1.0],
      },
    },
    // Metadata fields mapping
    {
      input: {
        headers: [
          "Fee Earner",
          "Date",
          "Hours",
          "Description",
          "Task Code",
          "Phase",
        ],
        metadataSchema: {
          taskCode: { type: "string" as const, name: "Task Code" },
          phase: {
            type: "enum" as const,
            name: "Phase",
            values: [{ name: "Discovery", value: "DISC" }],
          },
        },
        expectedMappings: {
          "Fee Earner": "timekeeperName",
          Date: "date",
          Hours: "hours",
          Description: "description",
          "Task Code": "metadata.taskCode",
          Phase: "metadata.phase",
        },
        expectedConfidenceRange: [0.3, 1.0],
      },
    },
    // Header format variations
    {
      input: {
        headers: [
          "fee-earner",
          "work_date",
          "Hrs",
          "Notes",
          "Invoice",
          "custom_field",
        ],
        expectedMappings: {
          "fee-earner": "timekeeperName",
          work_date: "date",
          Hrs: "hours",
          Notes: "description",
          Invoice: "billId",
          custom_field: "metadata.custom_field",
        },
        metadataSchema: {
          custom_field: { type: "string" as const, name: "Custom Field" },
        },
        expectedUnsupportedHeaders: [],
        expectedConfidenceRange: [0.3, 1.0],
      },
    },
    // Edge case: Empty headers
    {
      input: {
        headers: [],
        expectedMappings: {},
        expectedUnsupportedHeaders: [],
      },
    },
    // Edge case: All unmappable headers
    {
      input: {
        headers: ["RandomColumn", "AnotherRandom", "ThirdRandom"],
        expectedMappings: {},
        expectedUnsupportedHeaders: [
          "RandomColumn",
          "AnotherRandom",
          "ThirdRandom",
        ],
        expectedConfidenceRange: [0.0, 0.8],
      },
    },
    // Edge case: Mixed mappable and unmappable
    {
      input: {
        headers: ["RandomColumn", "AnotherRandom", "Date"],
        expectedMappings: {
          Date: "date",
        },
        expectedUnsupportedHeaders: ["RandomColumn", "AnotherRandom"],
      },
    },
    // Edge case: Complex headers with special characters
    {
      input: {
        headers: [
          "Fee Earner Name",
          "Work Date (YYYY-MM-DD)",
          "Hours Worked",
          "Task Description",
          "Bill #",
        ],
        expectedMappings: {
          "Fee Earner Name": "timekeeperName",
          "Work Date (YYYY-MM-DD)": "date",
          "Hours Worked": "hours",
          "Task Description": "description",
          "Bill #": "billId",
        },
        expectedConfidenceRange: [0.3, 1.0],
      },
    },
  ],
  task: async (input: InputFormat) => {
    const { context, service } = await setupTest();

    // Use matter with metadata schema if provided
    const matter = createMatterWithMetadata(
      context,
      input.metadataSchema || null
    );

    return await service.mapCsvHeaders(input.headers, matter);
  },
  scorers: [
    {
      name: "Mapping Accuracy",
      scorer: ({ output, input }) => {
        // Handle empty headers case
        if (input.headers.length === 0) {
          return Object.keys(output.mapping).length === 0 ? 1 : 0;
        }

        // Use appropriate expected mappings based on scenario
        const expectedMappings = input.expectedMappings || {};
        let correctMappings = 0;
        const totalExpected = Object.keys(expectedMappings).length;

        for (const [header, expectedField] of Object.entries(
          expectedMappings
        )) {
          if (output.mapping[header] === expectedField) {
            correctMappings++;
          }
        }

        return totalExpected > 0 ? correctMappings / totalExpected : 1;
      },
    },
    {
      name: "Unsupported Header Detection",
      scorer: ({ output, input }) => {
        // If no unsupported headers expected, check if result has none
        if (
          !input.expectedUnsupportedHeaders ||
          input.expectedUnsupportedHeaders.length === 0
        ) {
          return !output.unsupportedHeaders ||
            output.unsupportedHeaders.length === 0
            ? 1
            : 0;
        }

        if (!output.unsupportedHeaders) {
          return 0;
        }

        let correctUnsupported = 0;
        for (const expectedHeader of input.expectedUnsupportedHeaders) {
          if (output.unsupportedHeaders.includes(expectedHeader)) {
            correctUnsupported++;
          }
        }

        return correctUnsupported / input.expectedUnsupportedHeaders.length;
      },
    },
    {
      name: "Confidence Score Validity",
      scorer: ({
        output,
        input: { expectedConfidenceRange: [min, max] = [0, 1] },
      }) => {
        return output.confidence >= min && output.confidence <= max ? 1 : 0;
      },
    },
  ],
});
