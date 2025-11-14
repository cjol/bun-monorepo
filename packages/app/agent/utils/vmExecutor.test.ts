import { describe, test, expect } from "bun:test";
import { executeInVM, type VMExecutorConfig } from "./vmExecutor";
import { tool } from "ai";
import z from "zod";

describe("executeInVM", () => {
  test("should execute simple JavaScript code", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM("1 + 1", config);

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(2);
    expect(result.logs).toEqual([]);
  });

  test("should execute code with variables", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM(
      "const x = 5; const y = 10; x + y",
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(15);
  });

  test("should capture console.log output", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM(
      'console.log("Hello"); console.log("World"); 42',
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(42);
    expect(result.logs).toEqual(["Hello", "World"]);
  });

  test("should execute async code", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM(
      "await Promise.resolve(42)",
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(42);
  });

  test("should expose tools to the VM context", async () => {
    const addTool = tool({
      description: "Add two numbers",
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      execute: async ({ a, b }) => a + b,
    });

    const config: VMExecutorConfig = {
      tools: {
        add: addTool,
      },
    };

    const result = await executeInVM(
      "await add({ a: 5, b: 3 })",
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(8);
  });

  test("should expose multiple tools to the VM context", async () => {
    const multiplyTool = tool({
      description: "Multiply two numbers",
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      execute: async ({ a, b }) => a * b,
    });

    const subtractTool = tool({
      description: "Subtract two numbers",
      inputSchema: z.object({
        a: z.number(),
        b: z.number(),
      }),
      execute: async ({ a, b }) => a - b,
    });

    const config: VMExecutorConfig = {
      tools: {
        multiply: multiplyTool,
        subtract: subtractTool,
      },
    };

    const result = await executeInVM(
      "const product = await multiply({ a: 4, b: 5 }); await subtract({ a: product, b: 10 })",
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(10);
  });

  test("should handle errors in code execution", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM("throw new Error('Test error')", config);

    expect(result.error).toBeDefined();
    expect(result.error).toContain("Test error");
    expect(result.output).toBeNull();
  });

  test("should handle tool execution errors", async () => {
    const failingTool = tool({
      description: "A tool that fails",
      inputSchema: z.object({}),
      execute: async () => {
        throw new Error("Tool execution failed");
      },
    });

    const config: VMExecutorConfig = {
      tools: {
        failingTool,
      },
    };

    const result = await executeInVM("await failingTool({})", config);

    expect(result.error).toBeDefined();
    expect(result.error).toContain("Tool execution failed");
  });

  test("should respect timeout", async () => {
    const config: VMExecutorConfig = {
      tools: {},
      timeout: 100, // 100ms timeout
    };

    const result = await executeInVM(
      "await new Promise(resolve => setTimeout(resolve, 1000))",
      config
    );

    expect(result.error).toBeDefined();
    expect(result.error).toContain("timeout");
  });

  test("should handle complex data structures", async () => {
    const config: VMExecutorConfig = {
      tools: {},
    };

    const result = await executeInVM(
      '({ name: "test", values: [1, 2, 3], nested: { key: "value" } })',
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toEqual({
      name: "test",
      values: [1, 2, 3],
      nested: { key: "value" },
    });
  });

  test("should handle tool with complex parameters", async () => {
    const processDataTool = tool({
      description: "Process data",
      inputSchema: z.object({
        data: z.array(z.number()),
        operation: z.enum(["sum", "product"]),
      }),
      execute: async ({ data, operation }) => {
        if (operation === "sum") {
          return data.reduce((a, b) => a + b, 0);
        }
        return data.reduce((a, b) => a * b, 1);
      },
    });

    const config: VMExecutorConfig = {
      tools: {
        processData: processDataTool,
      },
    };

    const result = await executeInVM(
      'await processData({ data: [1, 2, 3, 4], operation: "sum" })',
      config
    );

    expect(result.error).toBeUndefined();
    expect(result.output).toBe(10);
  });
});