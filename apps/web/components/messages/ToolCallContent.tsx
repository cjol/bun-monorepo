"use client";

import { ToolCallPart } from "@ai-starter/core";
import { Group, Text } from "@mantine/core";

interface ToolCallContentProps {
  part: ToolCallPart
  result?: {
    output: {
      error?: string;
    };
  };
}

export function ToolCallContent({ result, part }: ToolCallContentProps) {
  // Determine status based on result
  let status : "pending" | "error" | "success";

  if (!result) {
    status = "pending";
  } else if (result.output.error) {
    status = "error";
  } else {
    status = "success";
  }

  const statusIcon = status === "pending" ? "⚙️" : status === "error" ? "✗" : "✓";
  const statusColor = status === "pending" ? "gray" : status === "error" ? "red" : "green";



  return (
    <Group gap="xs" c="dimmed">
      <Text size="sm" c={statusColor}>
        {statusIcon}
      </Text>
      <Text size="sm" c="dimmed">
        {
          part.toolName === "runCode"? status === "pending" ? "Working..." : status === "error" ? "Task failed" : "Task successful" : `Working... [${part.toolName}]`
        }
      </Text>
    </Group>
  );
}
