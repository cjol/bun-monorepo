"use client";

import { useState } from "react";
import { AppShell } from "../../components/AppShell";
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
import { useRouter } from "next/navigation";
import { IconPlus, IconEdit, IconTrash } from "@tabler/icons-react";
import { api } from "../../lib/api";

interface MatterFormValues {
  clientName: string;
  matterName: string;
  description: string;
}

export default function MattersPage() {
  const [editingMatter, setEditingMatter] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<MatterFormValues>({
    initialValues: {
      clientName: "",
      matterName: "",
      description: "",
    },
    validate: {
      clientName: (value) => (!value ? "Client name is required" : null),
      matterName: (value) => (!value ? "Matter name is required" : null),
    },
  });

  const { data: matters, isLoading } = useQuery({
    queryKey: ["matters"],
    queryFn: async () => {
      const response = await api.matters.get();
      if (response.error) throw new Error("Failed to fetch matters");
      return response.data;
    },
  });

  const createMatterMutation = useMutation({
    mutationFn: async (values: MatterFormValues) => {
      const response = await api.matters.post(values);
      if (response.error) throw new Error("Failed to create matter");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      notifications.show({
        title: "Success",
        message: "Matter created successfully",
        color: "green",
      });
      setOpened(false);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to create matter",
        color: "red",
      });
    },
  });

  const updateMatterMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: MatterFormValues;
    }) => {
      const response = await api.matters({ matterId: id }).patch(values);
      if (response.error) throw new Error("Failed to update matter");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      notifications.show({
        title: "Success",
        message: "Matter updated successfully",
        color: "green",
      });
      setOpened(false);
      setEditingMatter(null);
      form.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update matter",
        color: "red",
      });
    },
  });

  const deleteMatterMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.matters({ matterId: id }).delete();
      if (response.error) throw new Error("Failed to delete matter");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      notifications.show({
        title: "Success",
        message: "Matter deleted successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to delete matter",
        color: "red",
      });
    },
  });

  const handleEdit = (matter: {
    id: string;
    clientName: string;
    matterName: string;
    description: string | null;
  }) => {
    setEditingMatter(matter.id);
    form.setValues({
      clientName: matter.clientName,
      matterName: matter.matterName,
      description: matter.description || "",
    });
    setOpened(true);
  };

  const handleDelete = (id: string, name: string) => {
    modals.openConfirmModal({
      title: "Delete Matter",
      children: (
        <Text>
          Are you sure you want to delete <strong>{name}</strong>? This action
          cannot be undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: () => deleteMatterMutation.mutate(id),
    });
  };

  const handleSubmit = (values: MatterFormValues) => {
    if (editingMatter) {
      updateMatterMutation.mutate({ id: editingMatter, values });
    } else {
      createMatterMutation.mutate(values);
    }
  };

  return (
    <AppShell>
      <Container size="xl">
        <Group justify="space-between" mb="xl">
          <Title order={1}>Matters</Title>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => {
              setEditingMatter(null);
              form.reset();
              setOpened(true);
            }}
          >
            New Matter
          </Button>
        </Group>

        <Paper shadow="sm" p="md" radius="md" withBorder>
          {isLoading ? (
            <Group justify="center" p="xl">
              <Loader />
            </Group>
          ) : !matters || matters.length === 0 ? (
            <Text c="dimmed" ta="center" py="xl">
              No matters found. Create your first matter to get started.
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Client Name</Table.Th>
                  <Table.Th>Matter Name</Table.Th>
                  <Table.Th>Description</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {matters.map((matter) => (
                  <Table.Tr
                    key={matter.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/matters/${matter.id}`)}
                  >
                    <Table.Td>{matter.clientName}</Table.Td>
                    <Table.Td>
                      <Text fw={500}>{matter.matterName}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text lineClamp={2} size="sm" c="dimmed">
                        {matter.description || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">
                        {new Date(matter.createdAt).toLocaleDateString()}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(matter);
                          }}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(matter.id, matter.matterName);
                          }}
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
      </Container>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          setEditingMatter(null);
          form.reset();
        }}
        title={editingMatter ? "Edit Matter" : "Create New Matter"}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput
              label="Client Name"
              placeholder="Acme Corp"
              required
              {...form.getInputProps("clientName")}
            />
            <TextInput
              label="Matter Name"
              placeholder="Patent Litigation 2024"
              required
              {...form.getInputProps("matterName")}
            />
            <Textarea
              label="Description"
              placeholder="Optional description"
              {...form.getInputProps("description")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setOpened(false);
                  setEditingMatter(null);
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createMatterMutation.isPending ||
                  updateMatterMutation.isPending
                }
              >
                {editingMatter ? "Update" : "Create"} Matter
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </AppShell>
  );
}
