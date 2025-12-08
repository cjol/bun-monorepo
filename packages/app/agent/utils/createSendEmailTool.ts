import { tool } from "ai";
import { z } from "zod";

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  timestamp: string;
}

/**
 * Creates a tool that allows the agent to send emails.
 * Currently uses a mock implementation that simulates successful email delivery.
 */
export function createSendEmailTool() {
  return tool({
    description:
      "Send an email to a recipient. Use this to communicate with timekeepers or other stakeholders when you need additional information or clarification about time entries.",
    inputSchema: z.object({
      to: z
        .string()
        .email("Invalid email address")
        .describe("The recipient's email address"),
      subject: z.string().describe("The email subject line"),
      body: z.string().describe("The email body content"),
    }),
    execute: async ({ to: _to, subject: _subject, body: _body }) => {
      // Mock implementation - simulate realistic email sending delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Generate a realistic-looking message ID
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 15)}@mail.example.com>`;

      return {
        success: true,
        messageId,
        timestamp: new Date().toISOString(),
      } satisfies SendEmailResult;
    },
  });
}
