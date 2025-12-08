"use client";

import { useState } from "react";
import {
  Modal,
  Group,
  Text,
  Paper,
  Stack,
  Title,
  Collapse,
} from "@mantine/core";
import type { ActivityLog } from "@ai-starter/core";
import type {
  AgentJobParameters,
  ResponseMessage,
} from "../../worker/jobs/processAgentJob";
import { JobResultType } from "../../worker/processor";
import { MessageRenderer } from "./messages/MessageRenderer";
import { useDisclosure } from "@mantine/hooks";

interface ActivityModalProps {
  opened: boolean;
  onClose: () => void;
  activities: ActivityLog[];
}

export function ActivityModal({
  opened,
  onClose,
  activities,
}: ActivityModalProps) {
  const [paramsOpened, { toggle: toggleParamsOpened }] = useDisclosure(false);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(
    activities.length > 0 ? activities[0].id : null
  );

  // Reset selected activity when activities change
  if (activities.length > 0 && !selectedActivityId) {
    setSelectedActivityId(activities[0].id);
  }

  const handleClose = () => {
    onClose();
    setSelectedActivityId(null);
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Activity"
      size="90%"
      styles={{
        body: {
          height: "80vh",
          padding: 0,
        },
      }}
    >
      {activities.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No activities found
        </Text>
      ) : (
        <Group gap="md" h="100%">
          {/* Left pane - Activity list navigation */}
          <Paper withBorder radius="md" w={300} h="100%" p="sm">
            <Stack gap="xs" style={{ height: "100%", overflow: "auto" }}>
              {activities.map((activity) => {
                const isSelected = activity.id === selectedActivityId;
                const latestTime =
                  activity.finishedAt ||
                  activity.startedAt ||
                  activity.scheduledAt;

                return (
                  <Paper
                    key={activity.id}
                    p="sm"
                    withBorder
                    bg={isSelected ? "blue.0" : undefined}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedActivityId(activity.id)}
                  >
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={500} truncate>
                          <Text
                            span
                            size="xs"
                            style={{ marginRight: 6 }}
                            c={
                              activity.status === "completed"
                                ? "green"
                                : activity.status === "failed"
                                  ? "red"
                                  : activity.status === "running"
                                    ? "blue"
                                    : "gray"
                            }
                          >
                            ●
                          </Text>
                          {activity.name}
                        </Text>
                      </Group>
                      {latestTime && (
                        <Text size="xs" c="dimmed">
                          {new Date(latestTime).toLocaleString()}
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          </Paper>

          {/* Right pane - Activity details */}
          <Paper withBorder radius="md" style={{ flex: 1 }} h="100%" p="md">
            <div style={{ height: "100%", overflow: "auto" }}>
              {selectedActivityId ? (
                (() => {
                  const selectedActivity = activities.find(
                    (activity) => activity.id === selectedActivityId
                  );
                  if (!selectedActivity) return null;

                  const params =
                    selectedActivity.type === "agent_job"
                      ? (selectedActivity.parameters as AgentJobParameters)
                      : selectedActivity.type === "reviewing_email"
                        ? (selectedActivity.parameters as {
                            to: string;
                            subject: string;
                            body: string;
                            messageId: string;
                            timestamp: string;
                          })
                        : null;
                  const result = selectedActivity.result as JobResultType;

                  return (
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={600} size="lg">
                          {selectedActivity.name}
                        </Text>
                        <Text
                          size="sm"
                          fw={500}
                          c={
                            selectedActivity.status === "completed"
                              ? "green"
                              : selectedActivity.status === "failed"
                                ? "red"
                                : selectedActivity.status === "running"
                                  ? "blue"
                                  : "gray"
                          }
                        >
                          {selectedActivity.status.toUpperCase()}
                        </Text>
                      </Group>

                      <Group gap="lg" wrap="nowrap">
                        {selectedActivity.scheduledAt && (
                          <Text size="xs" c="dimmed">
                            Scheduled:{" "}
                            {new Date(
                              selectedActivity.scheduledAt
                            ).toLocaleString()}
                          </Text>
                        )}
                        {selectedActivity.startedAt && (
                          <Text size="xs" c="dimmed">
                            Started:{" "}
                            {new Date(
                              selectedActivity.startedAt
                            ).toLocaleString()}
                          </Text>
                        )}
                        {selectedActivity.finishedAt && (
                          <Text size="xs" c="dimmed">
                            Finished:{" "}
                            {new Date(
                              selectedActivity.finishedAt
                            ).toLocaleString()}
                          </Text>
                        )}
                      </Group>

                      {selectedActivity.result !== null &&
                        selectedActivity.result !== undefined && (
                          <div>
                            <Paper p="md">
                              {"error" in result ? (
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {result.error}
                                </pre>
                              ) : (
                                <MessageRenderer
                                  messages={result.result as ResponseMessage[]}
                                />
                              )}
                            </Paper>
                          </div>
                        )}

                      {selectedActivity.parameters !== null &&
                        selectedActivity.parameters !== undefined && (
                          <>
                            <Title
                              order={6}
                              onClick={toggleParamsOpened}
                              c="gray.6"
                            >
                              {paramsOpened ? "▼" : "▶"} Parameters
                            </Title>
                            <Collapse in={paramsOpened}>
                              <Paper p="xs" bg="gray.1">
                                <pre
                                  style={{
                                    margin: 0,
                                    fontSize: "12px",
                                    whiteSpace: "pre-wrap",
                                    wordBreak: "break-word",
                                  }}
                                >
                                  {selectedActivity.type === "agent_job"
                                    ? (params as AgentJobParameters)?.prompt
                                    : selectedActivity.type ===
                                        "reviewing_email"
                                      ? `To: ${(params as { to: string; subject: string; body: string })?.to}\nSubject: ${(params as { to: string; subject: string; body: string })?.subject}\n\n${(params as { to: string; subject: string; body: string })?.body}`
                                      : JSON.stringify(params, null, 2)}
                                </pre>
                              </Paper>
                            </Collapse>
                          </>
                        )}
                    </Stack>
                  );
                })()
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Select an activity to view details
                </Text>
              )}
            </div>
          </Paper>
        </Group>
      )}
    </Modal>
  );
}
