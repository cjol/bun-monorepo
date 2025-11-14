import { describe, expect, it } from "bun:test";
import { z } from "zod";
import {
  createSandboxTool,
  type SandboxFunction,
  type SandboxExecutionResult,
} from "./createSandboxTool";

// Helper type to extract the result type
type ExecuteResult = SandboxExecutionResult;

async function executeToolCode(
  tool: ReturnType<typeof createSandboxTool>,
  code: string
): Promise<ExecuteResult> {
  if (!tool.execute) {
    throw new Error("Tool execute function is not defined");
  }

  const result = await tool.execute(
    { code },
    { toolCallId: `test-${Math.random()}`, messages: [] }
  );

  // The result should be our SandboxExecutionResult, not an iterable
  if (Symbol.asyncIterator in Object(result)) {
    throw new Error("Unexpected async iterable result");
  }

  return result as ExecuteResult;
}

describe("createSandboxTool", () => {
  it("executes simple JavaScript code and returns output", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(tool, "return 1 + 1;");

    expect(result.output).toBe(2);
    expect(result.error).toBeUndefined();
    expect(result.logs).toEqual([]);
  });

  it("captures console.log output", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(
      tool,
      `
        console.log("Hello");
        console.log("World", 123);
        return "done";
      `
    );

    expect(result.output).toBe("done");
    expect(result.logs).toEqual(["Hello", "World 123"]);
    expect(result.error).toBeUndefined();
  });

  it("captures console.error output", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(
      tool,
      `
        console.error("Something went wrong");
        return "done";
      `
    );

    expect(result.output).toBe("done");
    expect(result.logs).toContain("ERROR: Something went wrong");
    expect(result.error).toBeUndefined();
  });

  it("handles runtime errors gracefully", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(
      tool,
      "throw new Error('Test error');"
    );

    expect(result.output).toBeUndefined();
    expect(result.error).toContain("Test error");
    expect(result.logs.some((log: string) => log.includes("ERROR:"))).toBe(
      true
    );
  });

  it("executes code with complex data types", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(
      tool,
      `
        const data = { name: "Alice", age: 30, tags: ["developer", "tester"] };
        return data;
      `
    );

    expect(result.output).toEqual({
      name: "Alice",
      age: 30,
      tags: ["developer", "tester"],
    });
    expect(result.error).toBeUndefined();
  });

  it("allows calling provided functions directly", async () => {
    const fetchData: SandboxFunction<
      { id: string },
      { id: string; name: string }
    > = {
      description: "Fetches data by ID",
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        return { id, name: `Item ${id}` };
      },
    };

    const tool = createSandboxTool({
      functions: { fetchData: fetchData as SandboxFunction<unknown, unknown> },
    });
    const result = await executeToolCode(
      tool,
      `
        const data = await fetchData({ id: "123" });
        console.log("Fetched data:", JSON.stringify(data));
        return data.name;
      `
    );

    expect(result.output).toBe("Item 123");
    expect(
      result.logs.some((log: string) => log.includes("Fetched data:"))
    ).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("validates function arguments against schema", async () => {
    const strictFunction: SandboxFunction<{ count: number }, number> = {
      description: "Requires a number",
      inputSchema: z.object({ count: z.number() }),
      execute: async ({ count }) => count * 2,
    };

    const tool = createSandboxTool({
      functions: {
        strictFunction: strictFunction as SandboxFunction<unknown, unknown>,
      },
    });
    const result = await executeToolCode(
      tool,
      `return await strictFunction({ count: "not a number" });`
    );

    expect(result.error).toBeDefined();
    expect(result.error).toMatchInlineSnapshot(`
      "❌ Validation error in function 'strictFunction'

      📋 Expected schema:
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "count": {
            "type": "number"
          }
        },
        "required": [
          "count"
        ],
        "additionalProperties": false
      }

      📥 Received input:
      {
        "count": "not a number"
      }

      ⚠️  Validation errors:
        • count: Invalid input: expected number, received string

      💡 To fix: Ensure your input matches the expected schema structure and types."
    `);
  });

  it("provides detailed validation errors with schema and input", async () => {
    const complexFunction: SandboxFunction<
      { name: string; age: number; tags: string[] },
      unknown
    > = {
      description: "A function with complex input requirements",
      inputSchema: z.object({
        name: z.string().describe("The person's name"),
        age: z.number().describe("The person's age"),
        tags: z.array(z.string()).describe("Array of tags"),
      }),
      execute: async () => ({}),
    };

    const tool = createSandboxTool({
      functions: {
        complexFunction: complexFunction as SandboxFunction<unknown, unknown>,
      },
    });

    const result = await executeToolCode(
      tool,
      `return await complexFunction({ name: "Alice", age: "thirty", tags: "not-an-array" });`
    );

    expect(result.error).toBeDefined();
    expect(result.error).toMatchInlineSnapshot(`
      "❌ Validation error in function 'complexFunction'

      📋 Expected schema:
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "properties": {
          "name": {
            "description": "The person's name",
            "type": "string"
          },
          "age": {
            "description": "The person's age",
            "type": "number"
          },
          "tags": {
            "description": "Array of tags",
            "type": "array",
            "items": {
              "type": "string"
            }
          }
        },
        "required": [
          "name",
          "age",
          "tags"
        ],
        "additionalProperties": false
      }

      📥 Received input:
      {
        "name": "Alice",
        "age": "thirty",
        "tags": "not-an-array"
      }

      ⚠️  Validation errors:
        • age: Invalid input: expected number, received string
        • tags: Invalid input: expected array, received string

      💡 To fix: Ensure your input matches the expected schema structure and types."
    `);
  });

  it("throws error when calling non-existent function", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(tool, "return await nonExistent({});");

    expect(result.error).toBeDefined();
    expect(result.error).toMatchInlineSnapshot(
      `"ReferenceError: nonExistent is not defined"`
    );
  });

  it("supports multiple function calls", async () => {
    const addOne: SandboxFunction<{ value: number }, number> = {
      description: "Adds 1 to a number",
      inputSchema: z.object({ value: z.number() }),
      execute: async ({ value }) => value + 1,
    };

    const double: SandboxFunction<{ value: number }, number> = {
      description: "Doubles a number",
      inputSchema: z.object({ value: z.number() }),
      execute: async ({ value }) => value * 2,
    };

    const tool = createSandboxTool({
      functions: {
        addOne: addOne as SandboxFunction<unknown, unknown>,
        double: double as SandboxFunction<unknown, unknown>,
      },
    });
    const result = await executeToolCode(
      tool,
      `
        const a = await addOne({ value: 10 });
        const b = await double({ value: 10 });
        return a + b;
      `
    );

    expect(result.output).toBe(31); // 11 + 20
    expect(result.error).toBeUndefined();
  });

  it("supports complex workflows with data processing", async () => {
    const getData: SandboxFunction<Record<string, never>, number[]> = {
      description: "Get array of numbers",
      inputSchema: z.object({}),
      execute: async () => [1, 2, 3, 4, 5],
    };

    const tool = createSandboxTool({
      functions: { getData: getData as SandboxFunction<unknown, unknown> },
    });
    const result = await executeToolCode(
      tool,
      `
        const numbers = await getData({});

        // Calculate statistics
        const sum = numbers.reduce((a, b) => a + b, 0);
        const mean = sum / numbers.length;
        const max = Math.max(...numbers);

        return { sum, mean, max, count: numbers.length };
      `
    );

    expect(result.output).toEqual({
      sum: 15,
      mean: 3,
      max: 5,
      count: 5,
    });
    expect(result.error).toBeUndefined();
  });

  it("respects timeout setting", async () => {
    const tool = createSandboxTool({ functions: {}, timeout: 100 });
    const result = await executeToolCode(
      tool,
      `
        while(true) {
          // Infinite loop
        }
      `
    );

    expect(result.error).toBeDefined();
    expect(result.error?.toLowerCase()).toContain("timed out");
  });

  it("isolates sandbox from external scope", async () => {
    const tool = createSandboxTool({ functions: {} });
    const result = await executeToolCode(
      tool,
      `
        try {
          // Try to access process (should not be available)
          return typeof process;
        } catch (e) {
          return "isolated";
        }
      `
    );

    // In vm context, global objects like 'process' are not available
    expect(result.output).toBe("undefined");
  });
});
