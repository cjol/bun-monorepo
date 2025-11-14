import { tool } from "ai";
import vm from "node:vm";
import { z, toJSONSchema } from "zod";

/**
 * A sandboxed function that can be called from within the VM.
 * Matches the structure returned by AI SDK's `tool` function.
 */
export interface SandboxFunction<INPUT = unknown, RESULT = unknown> {
  description: string;
  inputSchema: z.ZodType<INPUT>;
  execute: (input: INPUT) => Promise<RESULT> | RESULT;
}

/**
 * Options for creating a sandbox tool.
 */
export interface CreateSandboxToolOptions {
  /**
   * Functions that will be available to the sandboxed code.
   * The key is the function name that will be accessible in the sandbox.
   */
  functions: Record<string, SandboxFunction<unknown, unknown>>;

  /**
   * Memory limit for the context in MB. Defaults to 128MB.
   * Note: This is a soft limit and depends on V8's memory management.
   */
  memoryLimit?: number;

  /**
   * Timeout for code execution in milliseconds. Defaults to 30000ms (30 seconds).
   */
  timeout?: number;
}

/**
 * Result of executing code in the sandbox.
 */
export interface SandboxExecutionResult {
  /**
   * The return value from the executed code.
   */
  output: unknown;

  /**
   * Console output captured during execution.
   */
  logs: string[];

  /**
   * Any errors that occurred during execution.
   */
  error?: string;
}

/**
 * Formats a Zod validation error into a helpful message for the AI to understand
 * what went wrong and how to fix it.
 */
function formatValidationError(
  functionName: string,
  fn: SandboxFunction<unknown, unknown>,
  input: unknown,
  error: z.ZodError
): string {
  const lines: string[] = [];

  lines.push(`❌ Validation error in function '${functionName}'`);
  lines.push("");
  lines.push("📋 Expected schema:");
  lines.push(JSON.stringify(toJSONSchema(fn.inputSchema), null, 2));
  lines.push("");
  lines.push("📥 Received input:");
  lines.push(JSON.stringify(input, null, 2));
  lines.push("");
  lines.push("⚠️  Validation errors:");

  for (const issue of error.issues) {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    lines.push(`  • ${path}: ${issue.message}`);

    if (issue.code === "invalid_type") {
      const expected = (issue as { expected?: string }).expected;
      const received = (issue as { received?: string }).received;
      if (expected && received) {
        lines.push(`    Expected: ${expected}, Received: ${received}`);
      }
    }
  }

  lines.push("");
  lines.push(
    "💡 To fix: Ensure your input matches the expected schema structure and types."
  );

  return lines.join("\n");
}

/**
 * Creates a tool that executes JavaScript code in an isolated VM with access
 * to specified functions. This is useful for data analysis and code execution
 * where you want to provide the agent with a safe execution environment.
 *
 * Note: This uses Node.js's vm module which provides basic sandboxing but is not
 * completely secure against determined attackers. For production use with untrusted
 * code, consider using a more robust solution like Docker containers or WebAssembly.
 *
 * @param options Configuration options including available functions
 * @returns A tool that can be used with AI SDK agents
 *
 * @example
 * ```typescript
 * const sandboxTool = createSandboxTool({
 *   functions: {
 *     fetchData: {
 *       description: "Fetch data from the database",
 *       inputSchema: z.object({ query: z.string() }),
 *       execute: async ({ query }) => {
 *         return await db.query(query);
 *       },
 *     },
 *   },
 * });
 *
 * const agent = new Agent({
 *   model: anthropic("claude-haiku-4-5"),
 *   tools: { runCode: sandboxTool },
 * });
 *
 * // The AI can write code like:
 * // const data = await fetchData({ query: "SELECT * FROM users" });
 * // return data.length;
 * ```
 */
export function createSandboxTool(options: CreateSandboxToolOptions) {
  const { functions, timeout = 30000 } = options;

  return tool({
    description: `Execute JavaScript code in a secure sandbox environment. ${
      Object.keys(functions).length > 0
        ? `Available functions: ${Object.keys(functions).join(", ")}. `
        : ""
    }The code should return a value which will be captured as output. Console logs are also captured. Functions are async and should be awaited.`,
    inputSchema: z.object({
      code: z
        .string()
        .describe(
          "The JavaScript code to execute. Use 'return' to provide output. Available functions can be called directly."
        ),
    }),
    execute: async ({ code }) => {
      const logs: string[] = [];
      let output: unknown;
      let error: string | undefined;

      try {
        // Create sandbox context with console logging
        const sandbox: Record<string, unknown> = {
          console: {
            log: (...args: unknown[]) => {
              logs.push(
                args
                  .map((arg) =>
                    typeof arg === "object" ? JSON.stringify(arg) : String(arg)
                  )
                  .join(" ")
              );
            },
            error: (...args: unknown[]) => {
              logs.push(
                "ERROR: " +
                  args
                    .map((arg) =>
                      typeof arg === "object"
                        ? JSON.stringify(arg)
                        : String(arg)
                    )
                    .join(" ")
              );
            },
          },
        };

        // Inject functions into the sandbox
        // Each function is wrapped to validate its input and handle async execution
        for (const [name, fn] of Object.entries(functions)) {
          sandbox[name] = async (input: unknown) => {
            try {
              // Validate input against the function's schema
              const validatedInput = fn.inputSchema.parse(input);
              // Execute the function
              return await Promise.resolve(fn.execute(validatedInput));
            } catch (err) {
              // Format validation errors to help the AI understand what went wrong
              if (err instanceof z.ZodError) {
                const formattedError = formatValidationError(
                  name,
                  fn,
                  input,
                  err
                );
                throw new Error(formattedError);
              }
              throw err;
            }
          };
        }

        // Wrap code in an async function so it can use await
        const wrappedCode = `
          (async function() {
            ${code}
          })()
        `;

        // Create context and execute the code with timeout
        const context = vm.createContext(sandbox);
        const script = new vm.Script(wrappedCode);

        output = await script.runInContext(context, { timeout });
      } catch (err) {
        error =
          err instanceof Error
            ? err.message
            : typeof err === "string"
              ? err
              : String(err);
        logs.push(`ERROR: ${error}`);
      }

      return {
        output,
        logs,
        error,
      };
    },
  });
}
