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
        (sandbox.__logs__ as string[]).push(message);
      },
    },
    __logs__: [] as string[],
    __result__: undefined as unknown,
    // Provide a helper function to explicitly set the result
    return: (value: unknown) => {
      sandbox.__result__ = value;
    },
  };

  // Expose each tool as a function in the sandbox
  for (const [toolName, toolDef] of Object.entries(tools)) {
    sandbox[toolName] = async (...args: unknown[]) => {
      // Validate input using the tool's schema
      // CoreTool exposes the schema as 'parameters'
      const inputSchema = (toolDef as any).parameters;
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
    // We need to safely inject the code into the VM context
    // Use JSON.stringify to properly escape the code string, then eval it within the VM
    const codeJson = JSON.stringify(code);
    
    // Wrap the code to capture the result and handle async code
    // Strategy: Try to evaluate as an expression first, if that fails, execute as statements
    // and try to capture the last expression
    const wrappedCode = `
      (async () => {
        try {
          const codeStr = ${codeJson};
          let result;
          
          // First, try to evaluate the entire code as an expression
          // This works for single expressions like "1 + 1" or "await func()"
          try {
            result = eval('(' + codeStr + ')');
            __result__ = result;
          } catch (e) {
            // If that fails, it's likely statements. Execute them and try to capture last expression
            eval(codeStr);
            
            // Now try to extract and evaluate the last expression
            // Handle both multi-line (split by \\n) and single-line (split by ;) code
            const lines = codeStr.split('\\n').map(l => l.trim()).filter(l => l);
            let lastExpr = '';
            
            if (lines.length > 1) {
              // Multi-line: get the last line
              lastExpr = lines[lines.length - 1];
            } else if (lines.length === 1) {
              // Single line: split by semicolons and get the last part
              const parts = lines[0].split(';').map(p => p.trim()).filter(p => p);
              if (parts.length > 0) {
                lastExpr = parts[parts.length - 1];
              }
            }
            
            // Only try if last expression looks like an expression (not a statement)
            if (lastExpr && !lastExpr.endsWith(';') && 
                !lastExpr.match(/^(const|let|var|function|class|if|for|while|switch|try|return|throw|break|continue)\\s/)) {
              try {
                __result__ = eval(lastExpr);
              } catch (e2) {
                // Last expression evaluation failed, result stays undefined
                // (or whatever was set by the code itself)
              }
            }
          }
          
          // Handle promises
          if (__result__ instanceof Promise) {
            __result__ = await __result__;
          }
        } catch (error) {
          __result__ = { __error__: error.message || String(error) };
          throw error;
        }
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
    await Promise.race([
      resultPromise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Execution timeout")), timeout)
      ),
    ]);

    // Extract the result from the sandbox
    const result = (context as Record<string, unknown>).__result__;

    // Check if there was an error stored in the result
    if (
      result &&
      typeof result === "object" &&
      "__error__" in result &&
      typeof (result as { __error__: string }).__error__ === "string"
    ) {
      throw new Error((result as { __error__: string }).__error__);
    }

    // Extract logs from the context
    const logs = ((context as Record<string, unknown>).__logs__ as string[]) || [];

    return {
      output: result,
      logs,
    };
  } catch (error) {
    const logs = ((context as Record<string, unknown>).__logs__ as string[]) || [];
    return {
      output: null,
      logs,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}