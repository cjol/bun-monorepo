"use client";

import { Stack } from "@mantine/core";
import type { ResponseMessage } from "../../../worker/jobs/processAgentJob";
import { TextContent } from "./TextContent";
import { ToolCallContent } from "./ToolCallContent";

interface MessageRendererProps {
  messages: ResponseMessage[];
}

export function MessageRenderer({ messages }: MessageRendererProps) {
  // Build a map of toolCallId to tool result for quick lookup
  const toolResults = new Map<string, unknown>();

  // Collect all tool results from all messages
  for (const message of messages) {
    if (message.role === "tool") {
      for (const resultPart of message.content) {
        if (
          resultPart.type === "tool-result" &&
          resultPart.output.type === "json"
        ) {
          toolResults.set(resultPart.toolCallId, resultPart.output.value);
        }
      }
    }
  }

  // Render assistant messages with their content parts
  return (
    <Stack gap="sm">
      {messages
        .filter((message) => message.role === "assistant")
        .map((message, messageIndex) => (
          <Stack key={messageIndex} gap="xs">
            {Array.isArray(message.content)
              ? message.content.map((part, partIndex) => {
                  if (typeof part === "string") {
                    return <TextContent key={partIndex} text={part} />;
                  }

                  switch (part.type) {
                    case "text":
                      return <TextContent key={partIndex} text={part.text} />;
                    case "tool-call":
                      return (
                        <ToolCallContent
                          key={partIndex}
                          part={part}
                          result={toolResults.get(part.toolCallId)}
                        />
                      );
                    default:
                      // Skip other content types for now
                      return null;
                  }
                })
              : // Handle string content
                message.content && (
                  <TextContent key={messageIndex} text={message.content} />
                )}
          </Stack>
        ))}
    </Stack>
  );
}
