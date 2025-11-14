import type { MessageRepository, MessageContent } from "@ai-starter/core";
import { z } from "zod";

export interface Deps {
  repos: {
    message: MessageRepository;
  };
  emailProvider: EmailProvider;
}

export interface EmailProvider {
  send(params: SendEmailParams): Promise<SendEmailResult>;
}

export interface SendEmailParams {
  to: string;
  from: string;
  subject: string;
  body: string;
}

export interface SendEmailResult {
  messageId: string;
  success: boolean;
}

const sendEmailInputValidator = z.object({
  messageId: z.string().min(1),
  to: z.string().min(1),
  from: z.string().email().min(1),
  subject: z.string(),
  messageContent: z.array(z.any()),
});

export interface SendEmailInput {
  messageId: string;
  to: string;
  from: string;
  subject: string;
  messageContent: MessageContent;
}

export interface SendEmailOutput {
  success: boolean;
  emailMessageId: string;
}

export const EmailSendingService = (deps: Deps) => {
  const { emailProvider } = deps;

  return {
    sendEmail: async (input: SendEmailInput): Promise<SendEmailOutput> => {
      // Validate input
      sendEmailInputValidator.parse(input);

      // Extract text content from message parts
      const body = extractTextFromMessageContent(input.messageContent);

      // Send email via provider
      const result = await emailProvider.send({
        to: input.to,
        from: input.from,
        subject: input.subject,
        body,
      });

      return {
        success: result.success,
        emailMessageId: result.messageId,
      };
    },
  };
};

function extractTextFromMessageContent(content: MessageContent): string {
  const textParts = content.filter((part) => part.type === "text");
  return textParts.map((part) => (part as { text: string }).text).join("");
}

export type EmailSendingService = ReturnType<typeof EmailSendingService>;
