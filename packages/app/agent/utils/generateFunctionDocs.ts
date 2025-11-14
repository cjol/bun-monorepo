import { toJSONSchema } from "zod";
import type { SandboxFunction } from "./createSandboxTool";

/**
 * Helper function to generate documentation for available functions
 * that can be included in the agent's system prompt.
 *
 * @param functions The functions available in the sandbox
 * @returns Formatted documentation string
 */
export function generateFunctionDocs(
  functions: Record<string, SandboxFunction<unknown, unknown>>
): string {
  const entries = Object.entries(functions);
  if (entries.length === 0) {
    return "No additional functions are available.";
  }

  const docs = entries
    .map(([name, fn]) => {
      const jsonSchema = toJSONSchema(fn.inputSchema);

      return `### ${name}(input)\n\n${fn.description}\n\n**Input Schema:**\n\`\`\`json\n${JSON.stringify(jsonSchema, null, 2)}\n\`\`\``;
    })
    .join("\n\n");

  return `# Available Functions\n\nAll functions are async and must be awaited. Call them directly from your code.\n\n${docs}`;
}
