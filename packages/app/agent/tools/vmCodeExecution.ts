import { tool } from "ai";
import z from "zod";
import type { CoreTool } from "ai";
import { executeInVM, type VMExecutorConfig } from "../utils/vmExecutor";

/**
 * Configuration for the VM code execution tool
 */
export interface VMCodeExecutionToolConfig {
  /**
   * Tools to expose to the VM context. These should be in the same format
   * as AI SDK tool definitions (with zod schemas).
   */
  exposedTools: Record<string, CoreTool<any, any>>;
  /**
   * Timeout in milliseconds for code execution (default: 30000)
   */
  timeout?: number;
}

/**
 * Creates a VM code execution tool that can execute arbitrary code
 * with access to the provided tools.
 *
 * @param config Configuration including tools to expose to the VM
 * @returns An AI SDK tool definition for VM code execution
 */
export function createVMCodeExecutionTool(
  config: VMCodeExecutionToolConfig
) {
  const { exposedTools, timeout } = config;

  return tool({
    description:
      "Execute JavaScript/TypeScript code in a sandboxed VM environment. " +
      "The code can call functions that are exposed to the sandbox. " +
      "Use this for data analysis, calculations, or any code execution needs. " +
      "The code should be a valid JavaScript expression or statement(s). " +
      "The last expression's value will be returned as the result.",
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "The JavaScript/TypeScript code to execute. This can be a single expression " +
          "or multiple statements. The result of the last expression will be returned."
        ),
    }),
    execute: async ({ code }) => {
      const executorConfig: VMExecutorConfig = {
        tools: exposedTools,
        timeout,
      };

      const result = await executeInVM(code, executorConfig);

      if (result.error) {
        return {
          success: false,
          error: result.error,
          logs: result.logs,
        };
      }

      return {
        success: true,
        output: result.output,
        logs: result.logs,
      };
    },
  });
}