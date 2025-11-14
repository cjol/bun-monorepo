import { describe, expect, it } from "bun:test";
import { z } from "zod";
import { generateFunctionDocs } from "./generateFunctionDocs";

describe("generateFunctionDocs", () => {
  it("generates documentation for no functions", () => {
    const docs = generateFunctionDocs({});
    expect(docs).toMatchInlineSnapshot(
      `"No additional functions are available."`
    );
  });

  it("generates documentation for single function", () => {
    const functions = {
      fetchData: {
        description: "Fetches data from database",
        inputSchema: z.object({
          id: z.string().describe("The ID to fetch"),
        }),
        execute: async () => ({}),
      },
    };

    const docs = generateFunctionDocs(functions);
    expect(docs).toMatchInlineSnapshot(`
      "# Available Functions

      All functions are async and must be awaited. Call them directly from your code.

      ### fetchData(input)

      Fetches data from database

      **Input Schema:**
      \`\`\`json
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "id": {
            "description": "The ID to fetch",
            "type": "string"
          }
        },
        "required": [
          "id"
        ],
        "additionalProperties": false
      }
      \`\`\`"
    `);
  });

  it("generates documentation for multiple functions", () => {
    const functions = {
      add: {
        description: "Adds two numbers",
        inputSchema: z.object({
          a: z.number().describe("First number"),
          b: z.number().describe("Second number"),
        }),
        execute: async () => 0,
      },
      multiply: {
        description: "Multiplies two numbers",
        inputSchema: z.object({
          x: z.number().describe("First factor"),
          y: z.number().describe("Second factor"),
        }),
        execute: async () => 0,
      },
    };

    const docs = generateFunctionDocs(functions);
    expect(docs).toMatchInlineSnapshot(`
      "# Available Functions

      All functions are async and must be awaited. Call them directly from your code.

      ### add(input)

      Adds two numbers

      **Input Schema:**
      \`\`\`json
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "a": {
            "description": "First number",
            "type": "number"
          },
          "b": {
            "description": "Second number",
            "type": "number"
          }
        },
        "required": [
          "a",
          "b"
        ],
        "additionalProperties": false
      }
      \`\`\`

      ### multiply(input)

      Multiplies two numbers

      **Input Schema:**
      \`\`\`json
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "x": {
            "description": "First factor",
            "type": "number"
          },
          "y": {
            "description": "Second factor",
            "type": "number"
          }
        },
        "required": [
          "x",
          "y"
        ],
        "additionalProperties": false
      }
      \`\`\`"
    `);
  });

  it("handles functions without parameter descriptions", () => {
    const functions = {
      simple: {
        description: "A simple function",
        inputSchema: z.object({
          value: z.string(),
        }),
        execute: async () => ({}),
      },
    };

    const docs = generateFunctionDocs(functions);
    expect(docs).toMatchInlineSnapshot(`
      "# Available Functions

      All functions are async and must be awaited. Call them directly from your code.

      ### simple(input)

      A simple function

      **Input Schema:**
      \`\`\`json
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "value": {
            "type": "string"
          }
        },
        "required": [
          "value"
        ],
        "additionalProperties": false
      }
      \`\`\`"
    `);
  });
});
