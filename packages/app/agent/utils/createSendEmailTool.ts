import { tool } from "ai";
import { z } from "zod";
import type { ActivityLogService as ActivityLogServiceType } from "../../core/ActivityLogService";

export interface SendEmailResult {
  success: boolean;
  messageId: string;
  timestamp: string;
  activityId?: string;
}

export const emailInputSchema = z.object({
  to: z
    .email("Invalid email address")
    .describe("The recipient's email address"),
  subject: z.string().describe("The email subject line"),
  body: z.string().describe("The email body content"),
  timeEntryIds: z
    .array(z.string())
    .optional()
    .describe(
      "List of time entry IDs this email relates to. If not provided, will use context time entries."
    ),
});
export type SendEmailInput = z.infer<typeof emailInputSchema>;

/**
 * Creates a tool that allows the agent to send emails.
 * Currently uses a mock implementation that simulates successful email delivery.
 * Creates a reviewing_email activity log entry when emails are sent.
 */
export function createSendEmailTool(
  activityLogService: ActivityLogServiceType,
  context?: { timeEntryIds?: string[] }
) {
  return tool({
    description:
      "Send an email to a recipient. Use this to communicate with timekeepers or other stakeholders when you need additional information or clarification about time entries.",
    inputSchema: emailInputSchema,
    execute: async ({
      to,
      subject,
      body,
      timeEntryIds: explicitTimeEntryIds,
    }) => {
      // Mock implementation - simulate realistic email sending delay
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Generate a realistic-looking message ID
      const messageId = `<${Date.now()}.${Math.random().toString(36).substring(2, 15)}@mail.example.com>`;
      const timestamp = new Date().toISOString();

      // Determine which time entries to link to
      const timeEntryIds = explicitTimeEntryIds || context?.timeEntryIds || [];

      // Create activity log entry if we have time entries to link to
      let activityId: string | undefined;
      if (timeEntryIds.length > 0) {
        try {
          const activity =
            await activityLogService.createReviewingEmailActivity(
              `Email sent to ${to}`,
              {
                to,
                subject,
                body,
                messageId,
                timestamp,
              },
              timeEntryIds
            );
          activityId = activity.id;
        } catch (error) {
          console.error("Failed to create email activity log:", error);
        }
      }

      return {
        success: true,
        messageId,
        timestamp,
        activityId,
      } satisfies SendEmailResult;
    },
  });
}
