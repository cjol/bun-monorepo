import chalk, { type ChalkInstance } from "chalk";
import type { Message } from "@ai-starter/core";

/**
 * Renders a single message to stdout with appropriate formatting and colors.
 */
export function renderMessage(
  message: Message,
  opts: { skipTextParts: boolean } = { skipTextParts: false }
): void {
  const roleColors: Record<string, ChalkInstance> = {
    user: chalk.cyan,
    assistant: chalk.magenta,
    system: chalk.yellow,
    tool: chalk.green,
  };

  const roleColor = roleColors[message.role] || chalk.reset;

  // Check if there are any parts that should be rendered
  const hasRenderableParts = message.content.some(
    (part) =>
      part.type !== "text" || !opts.skipTextParts
  );

  // Only render if there are parts to render
  if (!hasRenderableParts) {
    return;
  }

  // Write role prefix once before rendering parts
  process.stdout.write(`\n${roleColor.bold(message.role + ":")} `);

  for (const part of message.content) {
    switch (part.type) {
      case "text":
        if (opts.skipTextParts) break;
        process.stdout.write(part.text);
        break;
      case "tool-call":
        process.stdout.write(
          `${chalk.green(`Invoking ${part.toolName}`)} ${chalk.dim(`with input: ${JSON.stringify(part.input)}`)}`
        );
        break;
      case "tool-result":
        process.stdout.write(
          `${chalk.blue(`Result from ${part.toolName}:`)} ${chalk.dim(JSON.stringify(part.output))}`
        );
        break;
    }
  }
  process.stdout.write("\n");
}

/**
 * Renders an array of messages to stdout.
 */
export function renderMessages(messages: Message[]): void {
  for (const message of messages) {
    renderMessage(message);
  }
}

/**
 * Renders a text delta (streaming text fragment) to stdout.
 * Call startTextStream before the first delta to render the role prefix.
 */
export function renderTextDelta(delta: string): void {
  process.stdout.write(delta);
}

/**
 * Starts a text stream by rendering the role prefix.
 * Should be called before rendering text deltas.
 */
export function startTextStream(role: string): void {
  const roleColors: Record<string, ChalkInstance> = {
    user: chalk.cyan,
    assistant: chalk.magenta,
    system: chalk.yellow,
    tool: chalk.green,
  };

  const roleColor = roleColors[role] || chalk.reset;
  process.stdout.write(`\n${roleColor.bold(role + ":")} `);
}

/**
 * Ends a text stream by writing a newline.
 */
export function endTextStream(): void {
  process.stdout.write("\n");
}
