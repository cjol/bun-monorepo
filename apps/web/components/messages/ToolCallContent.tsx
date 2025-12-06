"use client";

import { Group, Text } from "@mantine/core";

interface ToolCallContentProps {
  result?: {
    output: {
      error?: string;
    };
  };
}

export function ToolCallContent({ result }: ToolCallContentProps) {
  // Determine status based on result
  let statusIcon: string;
  let statusColor: string;

  if (!result) {
    // No result yet - show working icon
    statusIcon = "⚙️";
    statusColor = "gray";
  } else if (result.output.error) {
    // Error occurred
    statusIcon = "✗";
    statusColor = "red";
  } else {
    // Success
    statusIcon = "✓";
    statusColor = "green";
  }

  return (
    <Group gap="xs" c="dimmed">
      <Text size="sm" c={statusColor}>
        {statusIcon}
      </Text>
      <Text size="sm" c="dimmed">
        Working...
      </Text>
    </Group>
  );
}
