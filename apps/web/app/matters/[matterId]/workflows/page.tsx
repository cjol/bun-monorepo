"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Container,
  Button,
  Table,
  Group,
  Text,
  ActionIcon,
  Modal,
  TextInput,
  Textarea,
  Stack,
  Loader,
  Paper,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { Workflow } from "@ai-starter/core";

interface WorkflowFormValues {
  name: string;
  instructions: string;
  trigger: "time_entry:batch_created";
}

export default function WorkflowsPage() {
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  const form = useForm<WorkflowFormValues>({
    initialValues: {
      name: "",
      instructions: "",
      trigger: "time_entry:batch_created",
    },
    validate: {
      name: (value) => (!value ? "Name is required" : null),
      instructions: (value) => (!value ? "Instructions are required" : null),
    },
  });

  const { data: workflows, isLoading } = useQuery({
    queryKey: ["workflows", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).workflows.get();
      if (response.error) throw new Error("Failed to fetch workflows");
      return response.data;
    },
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async (values: WorkflowFormValues) => {
      const response = await api.matters({ matterId }).workflows.post({
        name: values.name,
        instructions: values.instructions,
        trigger: values.trigger,
      });
      if (response.error) throw new Error("Failed to create workflow");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow created successfully",
        color: "green",
      });
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create workflow",
        color: "red",
      });
    },
  });

  const updateWorkflowMutation = useMutation({
    mutationFn: async ({
      matterId,
      id,
      values,
    }: {
      matterId: string;
      id: string;
      values: Partial<WorkflowFormValues>;
    }) => {
      const response = await api
        .matters({ matterId })
        .workflows({ workflowId: id })
        .patch(values);
      if (response.error) throw new Error("Failed to update workflow");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow updated successfully",
        color: "green",
      });
      setOpened(false);
      setEditingWorkflow(null);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update workflow",
        color: "red",
      });
    },
  });

  const deleteWorkflowMutation = useMutation({
    mutationFn: async ({ matterId, id }: { matterId: string; id: string }) => {
      const response = await api
        .matters({ matterId })
        .workflows({ workflowId: id })
        .delete();
      if (response.error) throw new Error("Failed to delete workflow");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      notifications.show({
        title: "Success",
        message: "Workflow deleted successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to delete workflow",
        color: "red",
      });
    },
  });

  const handleEdit = (workflow: Workflow) => {
    setEditingWorkflow(workflow.id);
    form.setValues({
      name: workflow.name,
      instructions: workflow.instructions,
      trigger: workflow.trigger as "time_entry:batch_created",
    });
    setOpened(true);
  };

  const handleDelete = (matterId: string, id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Workflow",
      children: (
        <Text>
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteWorkflowMutation.mutate({ matterId, id }),
    });
  };

  const handleSubmit = (values: WorkflowFormValues) => {
    if (editingWorkflow) {
      updateWorkflowMutation.mutate({
        matterId,
        id: editingWorkflow,
        values,
      });
    } else {
      createWorkflowMutation.mutate(values);
    }
  };

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Workflows</Title>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => {
            setEditingWorkflow(null);
            form.reset();
            setOpened(true);
          }}
        >
          New Workflow
        </Button>
      </Group>

      <Paper shadow="sm" p="md" radius="md" withBorder>
        {isLoading ? (
          <Group justify="center" p="xl">
            <Loader />
          </Group>
        ) : !workflows || workflows.length === 0 ? (
          <Text c="dimmed" ta="center" py="xl">
            No workflows found for this matter.
          </Text>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Instructions</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {workflows.map((workflow: Workflow) => (
                <Table.Tr key={workflow.id}>
                  <Table.Td>
                    <Text fw={500}>{workflow.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text lineClamp={2} size="sm" c="dimmed">
                      {workflow.instructions}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {new Date(workflow.createdAt).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <ActionIcon
                        variant="subtle"
                        onClick={() => handleEdit(workflow)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() =>
                          handleDelete(matterId, workflow.id, workflow.name)
                        }
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditingWorkflow(null);
          form.reset();
        }}
        title={editingWorkflow ? "Edit Workflow" : "Create New Workflow"}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Time Entry Review Process"
              required
              {...form.getInputProps("name")}
            />
            <Textarea
              label="Instructions"
              placeholder="Natural language instructions for this workflow..."
              required
              minRows={6}
              {...form.getInputProps("instructions")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  setEditingWorkflow(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createWorkflowMutation.isPending ||
                  updateWorkflowMutation.isPending
                }
              >
                {editingWorkflow ? "Update" : "Create"} Workflow
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
