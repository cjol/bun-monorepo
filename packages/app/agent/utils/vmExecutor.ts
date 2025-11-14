import type { CoreTool } from "ai";
import { createContext, Script, type Context } from "vm";

/**
 * Configuration for VM code execution
 */
export interface VMExecutorConfig {
  /**
   * Tools to expose to the VM context. These should be in the same format
   * as AI SDK tool definitions (with zod schemas).
   */
  tools: Record<string, CoreTool<any, any>>;
  /**
   * Timeout in milliseconds for code execution (default: 30000)
   */
  timeout?: number;
}

/**
 * Result of VM code execution
 */
export interface VMExecutionResult {
  /**
   * The output/return value of the executed code
   */
  output: unknown;
  /**
   * Any console.log output captured during execution
   */
  logs: string[];
  /**
   * Any errors that occurred during execution
   */
  error?: string;
}

/**
 * Creates a VM context with the provided tools available.
 * Tools are exposed as functions that can be called from the executed code.
 *
 * @param config Configuration including tools to expose
 * @returns A VM context with tools available
 */
function createVMContext(config: VMExecutorConfig): Context {
  const { tools } = config;

  // Create a sandbox object that will hold all available functions
  const sandbox: Record<string, unknown> = {
    console: {
      log: (...args: unknown[]) => {
        // Capture console.log output
        const message = args
          .map((arg) => {
            if (typeof arg === "object") {
              return JSON.stringify(arg, null, 2);
            }
            return String(arg);
          })
          .join(" ");
        sandbox.__logs__.push(message);
      },
    },
    __logs__: [] as string[],
  };

  // Expose each tool as a function in the sandbox
  for (const [toolName, toolDef] of Object.entries(tools)) {
    sandbox[toolName] = async (...args: unknown[]) => {
      // Validate input using the tool's schema
      const inputSchema = toolDef.parameters;
      if (inputSchema) {
        // If the tool expects a single object argument, parse it
        // Otherwise, pass arguments as-is
        const input =
          args.length === 1 && typeof args[0] === "object"
            ? args[0]
            : args.length === 0
              ? {}
              : { args };

        const parsed = inputSchema.parse(input);
        return await toolDef.execute(parsed);
      }
      // If no schema, pass arguments directly
      return await toolDef.execute(...args);
    };
  }

  return createContext(sandbox);
}

/**
 * Executes code in a VM context with the provided tools available.
 *
 * @param code The code to execute (should be a string that evaluates to a value or calls functions)
 * @param config Configuration including tools to expose
 * @returns The execution result with output, logs, and any errors
 */
export async function executeInVM(
  code: string,
  config: VMExecutorConfig
): Promise<VMExecutionResult> {
  const timeout = config.timeout ?? 30000;
  const context = createVMContext(config);

  try {
    // Wrap the code to capture the return value and handle async code
    // The code can be sync or async - we'll handle both
    const wrappedCode = `
      (async () => {
        ${code}
      })()
    `;

    // Create a script with timeout
    const script = new Script(wrappedCode, {
      timeout,
      displayErrors: true,
    });

    // Execute the script synchronously - if code is async, this returns a Promise
    const executionResult = script.runInContext(context, {
      timeout,
      displayErrors: true,
    });

    // If the result is a Promise, await it; otherwise use it directly
    const resultPromise =
      executionResult instanceof Promise
        ? executionResult
        : Promise.resolve(executionResult);

    // Race between execution and timeout
    const result = await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Execution timeout")), timeout)
      ),
    ]);

    // Extract logs from the context
    const logs = (context.__logs__ as string[]) || [];

    return {
      output: result,
      logs,
    };
  } catch (error) {
    const logs = (context.__logs__ as string[]) || [];
    return {
      output: null,
      logs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}