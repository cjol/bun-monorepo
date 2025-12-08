"use client";

import { ToolCallPart } from "@ai-starter/core";
import { Group, Text } from "@mantine/core";

interface ToolCallContentProps {
  part: ToolCallPart;
  result?: {
    output: {
      error?: string;
    };
  };
}

function getToolDisplayInfo(
  toolName: string,
  status: "pending" | "error" | "success"
) {
  switch (toolName) {
    case "runCode":
      return {
        pending: "Working...",
        error: "Task failed",
        success: "Task successful",
      }[status];
    case "sendEmail":
      return {
        pending: "Sending email...",
        error: "Failed to send email",
        success: "Email sent",
      }[status];
    case "searchDocumentStore":
      return {
        pending: "Searching documents...",
        error: "Search failed",
        success: "Search complete",
      }[status];
    default:
      return {
        pending: `Working... [${toolName}]`,
        error: `Failed [${toolName}]`,
        success: `Complete [${toolName}]`,
      }[status];
  }
}

export function ToolCallContent({ result, part }: ToolCallContentProps) {
  // Determine status based on result
  let status: "pending" | "error" | "success";

  if (!result) {
    status = "pending";
  } else if (result.output.error) {
    status = "error";
  } else {
    status = "success";
  }

  const statusIcon =
    status === "pending" ? "⚙️" : status === "error" ? "✗" : "✓";
  const statusColor =
    status === "pending" ? "gray" : status === "error" ? "red" : "green";

  return (
    <Group gap="xs" c="dimmed">
      <Text size="sm" c={statusColor}>
        {statusIcon}
      </Text>
      <Text size="sm" c="dimmed">
        {getToolDisplayInfo(part.toolName, status)}
      </Text>
    </Group>
  );
}
