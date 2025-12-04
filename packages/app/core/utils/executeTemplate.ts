import { z } from "zod";
import * as vm from "node:vm";
import type { DocumentTemplate } from "@ai-starter/core";

export interface ExecuteTemplateOptions {
  /** The document template to execute */
  template: DocumentTemplate;
  /** Data to pass to the template */
  data: unknown;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
}

export interface ExecuteTemplateResult {
  /** The generated content */
  output: string | Buffer;
  /** Captured console.log output */
  logs: string[];
  /** Error if execution failed */
  error?: string;
}

/**
 * Execute a document template in a secure VM context.
 * Templates receive `data` and `console.log` (captured).
 * No database or sandbox functions are available.
 */
export const executeTemplate = async (
  options: ExecuteTemplateOptions
): Promise<ExecuteTemplateResult> => {
  const { template, data, timeout = 10000 } = options;
  const logs: string[] = [];

  try {
    // Validate data against template schema
    // For now, skip validation to focus on template execution
    // TODO: Implement proper JSON Schema to Zod conversion
    const validatedData = data;

    // Create sandbox context
    const sandbox: Record<string, unknown> = {
      data: validatedData,
      console: {
        log: (...args: unknown[]) => {
          logs.push(
            args
              .map((arg) =>
                typeof arg === "string" ? arg : JSON.stringify(arg)
              )
              .join(" ")
          );
        },
      },
    };

    // Wrap template code in async function
    const wrappedCode = `
      (async function() {
        ${template.templateCode}
      })()
    `;

    // Create context and execute
    const context = vm.createContext(sandbox);
    const script = new vm.Script(wrappedCode);

    const output = await Promise.race([
      script.runInContext(context, { timeout }),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Template execution timeout")),
          timeout
        )
      ),
    ]);

    return {
      output: output as string | Buffer,
      logs,
    };
  } catch (error) {
    return {
      output: "",
      logs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
