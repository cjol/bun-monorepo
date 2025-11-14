import { Experimental_Agent as Agent, stepCountIs, tool } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import type { FooRepository } from "@ai-starter/core";
import {
  createSandboxTool,
  generateFunctionDocs,
  type SandboxFunction,
} from "./utils";

/**
 * Example: Creating an agent with sandbox capabilities for data analysis.
 *
 * This demonstrates how to provide an AI agent with the ability to execute
 * JavaScript code in a sandbox environment while exposing specific functions
 * for data access and manipulation.
 */

// Define the functions that will be available in the sandbox
function createDataAnalysisFunctions(fooRepo: FooRepository) {
  const fetchFooById: SandboxFunction<{ id: string }, unknown> = {
    description: "Fetch a specific foo item by ID",
    inputSchema: z.object({
      id: z.string().describe("The ID of the foo item to fetch"),
    }),
    execute: async ({ id }) => {
      const foo = await fooRepo.get(id);
      if (!foo) {
        throw new Error(`Foo with ID ${id} not found`);
      }
      return foo;
    },
  };
  const listFoos: SandboxFunction<unknown, unknown[]> = {
    description: "List all foo items",
    inputSchema: z.object({}),
    execute: async () => {
      return await fooRepo.listAll();
    },
  };

  const calculateStats: SandboxFunction<{ numbers: number[] }, unknown> = {
    description: "Calculate statistical metrics for an array of numbers",
    inputSchema: z.object({
      numbers: z.array(z.number()).describe("Array of numbers to analyze"),
    }),
    execute: async ({ numbers }) => {
      const sum = numbers.reduce((a: number, b: number) => a + b, 0);
      const mean = sum / numbers.length;
      const min = Math.min(...numbers);
      const max = Math.max(...numbers);
      return { sum, mean, min, max, count: numbers.length };
    },
  };

  return {
    fetchFooById,
    listFoos,
    calculateStats,
  } as Record<string, SandboxFunction<unknown, unknown>>;
}

/**
 * Creates an agent configured for data analysis with sandbox code execution.
 */
export function createDataAnalysisAgent(fooRepo: FooRepository) {
  const sandboxFunctions = createDataAnalysisFunctions(fooRepo);

  return new Agent({
    model: anthropic("claude-haiku-4-5"),
    system: `You are a data analysis assistant. You can help users analyze data by writing JavaScript code.

You have access to a code sandbox where you can execute JavaScript code to process and analyze data.
You can call functions directly from your code to fetch data and perform operations.

All functions are async and must be awaited. Example usage:

\`\`\`javascript
const foo = await fetchFooById({ id: "some-id" });
console.log("Got foo:", foo.name);

const stats = await calculateStats({ numbers: [1, 2, 3, 4, 5] });
return stats.mean;
\`\`\`

You can combine function calls with any JavaScript logic to analyze and transform data.
Use console.log() for debugging -- you will be able to see the logs in the output.

The return value will be shown to the user, but not to you to preserve your context window and protect sensitive information.

${generateFunctionDocs(sandboxFunctions)}}
`,
    tools: {
      runCode: createSandboxTool({
        functions: sandboxFunctions,
        timeout: 30000,
      }),
      getWeather: tool({
        description: "Get current weather for a location",
        inputSchema: z.object({
          location: z
            .string()
            .describe("The city and state, e.g. San Francisco, CA"),
        }),
        execute: async () => {
          // Simulate weather API call
          await new Promise((resolve) => setTimeout(resolve, 500));
          return {
            temperature: Math.floor(Math.random() * 30) + " degrees celsius",
          };
        },
      }),
    },
    stopWhen: stepCountIs(10),
  });
}

/**
 * Example: Simple agent without sandbox (existing behavior)
 */
export const simpleAgent = new Agent({
  model: anthropic("claude-haiku-4-5"),
  system:
    "You are a helpful assistant for an extraterrestrial weather service.",
  tools: {
    getWeather: tool({
      description: "Get Weather",
      inputSchema: z.object({
        location: z
          .string()
          .describe("The city and state, e.g. San Francisco, CA"),
      }),
      execute: async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        return { output: Math.floor(Math.random() * 30) + " degrees celsius" };
      },
    }),
  },
  stopWhen: stepCountIs(5),
});
