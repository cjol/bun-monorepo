"use client";

import { useState } from "react";
import {
  Select,
  Button,
  Group,
  Modal,
  TextInput,
  Textarea,
  Stack,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IconPlus } from "@tabler/icons-react";
import { api } from "../lib/api";

interface NewMatterFormValues {
  clientName: string;
  matterName: string;
  description: string;
}

export function MatterSwitcher() {
  const [opened, setOpened] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<NewMatterFormValues>({
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
    mutationFn: async (values: NewMatterFormValues) => {
      const response = await api.matters.post(values);
      if (response.error) throw new Error("Failed to create matter");
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matters"] });
      notifications.show({
        title: "Success",
        message: "Matter created successfully",
        color: "green",
      });
      setSelectedMatterId(data.id);
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

  const matterOptions =
    matters?.map((matter) => ({
      value: matter.id,
      label: `${matter.clientName} - ${matter.matterName}`,
    })) || [];

  return (
    <>
      <Group gap="xs">
        <Select
          placeholder="Select a matter"
          data={matterOptions}
          value={selectedMatterId}
          onChange={setSelectedMatterId}
          searchable
          clearable
          disabled={isLoading}
          w={300}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={() => setOpened(true)}
        >
          New
        </Button>
      </Group>

      <Modal
        opened={opened}
        onClose={() => {
          setOpened(false);
          form.reset();
        }}
        title="Create New Matter"
      >
        <form
          onSubmit={form.onSubmit((values) =>
            createMatterMutation.mutate(values)
          )}
        >
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
                  form.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={createMatterMutation.isPending}>
                Create Matter
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
