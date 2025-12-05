"use client";

import { useState } from "react";
import { Modal, Group, Text, Paper, Stack, Title } from "@mantine/core";
import type { Job } from "@ai-starter/core";
import type { AgentJobParameters } from "../../worker/jobs/processAgentJob";
import { JobResultType } from "../../worker/processor";

interface ActivityModalProps {
  opened: boolean;
  onClose: () => void;
  jobs: Job[];
}

export function ActivityModal({ opened, onClose, jobs }: ActivityModalProps) {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    jobs.length > 0 ? jobs[0].id : null
  );

  // Reset selected job when jobs change
  if (jobs.length > 0 && !selectedJobId) {
    setSelectedJobId(jobs[0].id);
  }

  const handleClose = () => {
    onClose();
    setSelectedJobId(null);
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
      {jobs.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          No jobs found
        </Text>
      ) : (
        <Group gap="md" h="100%">
          {/* Left pane - Job list navigation */}
          <Paper withBorder radius="md" w={300} h="100%" p="sm">
            <Stack gap="xs" style={{ height: "100%", overflow: "auto" }}>
              {jobs.map((job) => {
                const isSelected = job.id === selectedJobId;
                const latestTime =
                  job.finishedAt || job.startedAt || job.scheduledAt;

                return (
                  <Paper
                    key={job.id}
                    p="sm"
                    withBorder
                    bg={isSelected ? "blue.0" : undefined}
                    style={{ cursor: "pointer" }}
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <Stack gap="xs">
                      <Group gap="xs" align="center">
                        <Text size="sm" fw={500} truncate>
                          <Text
                            span
                            size="xs"
                            style={{ marginRight: 6 }}
                            c={
                              job.status === "completed"
                                ? "green"
                                : job.status === "failed"
                                  ? "red"
                                  : job.status === "running"
                                    ? "blue"
                                    : "gray"
                            }
                          >
                            ●
                          </Text>
                          {job.name}
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

          {/* Right pane - Job details */}
          <Paper withBorder radius="md" style={{ flex: 1 }} h="100%" p="md">
            <div style={{ height: "100%", overflow: "auto" }}>
              {selectedJobId ? (
                (() => {
                  const selectedJob = jobs.find(
                    (job) => job.id === selectedJobId
                  );
                  if (!selectedJob) return null;

                  const params =
                    selectedJob.type === "agent"
                      ? (selectedJob.parameters as AgentJobParameters)
                      : null;
                  const result = selectedJob.result as JobResultType;

                  return (
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text fw={600} size="lg">
                          {selectedJob.name}
                        </Text>
                        <Text
                          size="sm"
                          fw={500}
                          c={
                            selectedJob.status === "completed"
                              ? "green"
                              : selectedJob.status === "failed"
                                ? "red"
                                : selectedJob.status === "running"
                                  ? "blue"
                                  : "gray"
                          }
                        >
                          {selectedJob.status.toUpperCase()}
                        </Text>
                      </Group>

                      <Group gap="lg" wrap="nowrap">
                        {selectedJob.scheduledAt && (
                          <Text size="xs" c="dimmed">
                            Scheduled:{" "}
                            {new Date(selectedJob.scheduledAt).toLocaleString()}
                          </Text>
                        )}
                        {selectedJob.startedAt && (
                          <Text size="xs" c="dimmed">
                            Started:{" "}
                            {new Date(selectedJob.startedAt).toLocaleString()}
                          </Text>
                        )}
                        {selectedJob.finishedAt && (
                          <Text size="xs" c="dimmed">
                            Finished:{" "}
                            {new Date(selectedJob.finishedAt).toLocaleString()}
                          </Text>
                        )}
                      </Group>

                      {selectedJob.parameters !== null &&
                        selectedJob.parameters !== undefined && (
                          <div>
                            <Title order={5}>Parameters</Title>
                            <Paper p="xs" bg="gray.0">
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: "12px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {params?.prompt}
                              </pre>
                            </Paper>
                          </div>
                        )}

                      {selectedJob.result !== null &&
                        selectedJob.result !== undefined && (
                          <div>
                            <Title order={5}>Result</Title>
                            <Paper p="xs" bg="gray.0">
                              <pre
                                style={{
                                  margin: 0,
                                  fontSize: "12px",
                                  whiteSpace: "pre-wrap",
                                  wordBreak: "break-word",
                                }}
                              >
                                {"error" in result
                                  ? result.error
                                  : JSON.stringify(result.result)}
                              </pre>
                            </Paper>
                          </div>
                        )}
                    </Stack>
                  );
                })()
              ) : (
                <Text c="dimmed" ta="center" py="xl">
                  Select a job to view details
                </Text>
              )}
            </div>
          </Paper>
        </Group>
      )}
    </Modal>
  );
}
