"use client";

import { ToolCallPart } from "@ai-starter/core";
import { Group, Text } from "@mantine/core";
import { SendEmailInput } from "../../../../packages/app/agent/utils/createSendEmailTool";

interface ToolCallContentProps {
  part: ToolCallPart;
  result?: {
    output: unknown;
  };
}

function getToolDisplayInfo({ toolName, input }: ToolCallPart, result: any) {
  switch (toolName) {
    case "runCode":
      return {
        pending: "Working...",
        error: "Task failed",
        success: "Task successful",
      };
    case "sendEmail":
      return {
        pending: `Sending email to ${(input as SendEmailInput).to}...`,
        error: `Failed to send email to ${(input as SendEmailInput).to}`,
        success: `Email sent to ${(input as SendEmailInput).to}`,
      };
    case "searchDocumentStore":
      return {
        pending: "Searching documents...",
        error: "Document search failed",
        success: (
          <span>
            Document search complete:{" "}
            {result.output.results.map(
              (doc: { id: string; title: string }, index: number) => (
                <span key={doc.id}>
                <br />
                  <a
                    href="#"
                    style={{ color: "inherit", textDecoration: "underline" }}
                  >
                    📄 {doc.title}
                  </a>
                </span>
              )
            )}
          </span>
        ),
      };
    default:
      return {
        pending: `Working... [${toolName}]`,
        error: `Failed [${toolName}]`,
        success: `Complete [${toolName}]`,
      };
  }
}

export function ToolCallContent({ result, part }: ToolCallContentProps) {
  // Determine status based on result
  let status: "pending" | "error" | "success";

  if (!result) {
    status = "pending";
  } else if ("error" in result.output) {
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
        {getToolDisplayInfo(part, result)[status]}
      </Text>
    </Group>
  );
}
