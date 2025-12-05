import type { SandboxFunction } from "./createSandboxTool";
import type { SandboxFunctionName } from "../GeneralPurposeAgent";

/**
 * Filters sandbox functions to only include those in the allowed list.
 *
 * @param functions The full set of sandbox functions
 * @param allowedFunctions Array of function names to allow
 * @returns Filtered record containing only allowed functions
 */
export function filterSandboxFunctions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functions: Record<string, SandboxFunction<any, unknown>>,
  allowedFunctions: SandboxFunctionName[]
) {
  const allowedSet = new Set<string>(allowedFunctions);
  return Object.fromEntries(
    Object.entries(functions).filter(([name]) => allowedSet.has(name))
  );
}
