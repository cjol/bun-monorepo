"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  Title,
  Container,
  Paper,
  Group,
  Text,
  Stack,
  Loader,
  Badge,
  Table,
  ActionIcon,
  Button,
  Modal,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  SimpleGrid,
  Card,
  ThemeIcon,
  Divider,
  Accordion,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { modals } from "@mantine/modals";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconFileText,
  IconFileTypePdf,
  IconFileSpreadsheet,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSettings,
} from "@tabler/icons-react";
import { api } from "../../../../lib/api";
import type { Workflow, TimekeeperRole } from "@ai-starter/core";

// Hard-coded context documents for now
const contextDocuments = [
  {
    id: "1",
    name: "Client Billing Guidelines",
    type: "pdf",
    description: "Billing rules and requirements specific to this client",
  },
  {
    id: "2",
    name: "Firm Billing Guidelines",
    type: "pdf",
    description: "Standard billing practices and policies for the firm",
  },
  {
    id: "3",
    name: "Matter Budget",
    type: "spreadsheet",
    description: "Budget allocations and tracking for this matter",
  },
  {
    id: "4",
    name: "Engagement Letter",
    type: "document",
    description: "Terms of engagement with the client",
  },
  {
    id: "5",
    name: "Rate Card",
    type: "spreadsheet",
    description: "Approved billing rates for different roles",
  },
];

const getDocumentIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return IconFileTypePdf;
    case "spreadsheet":
      return IconFileSpreadsheet;
    default:
      return IconFileText;
  }
};

const getDocumentColor = (type: string) => {
  switch (type) {
    case "pdf":
      return "red";
    case "spreadsheet":
      return "green";
    default:
      return "blue";
  }
};

interface TimekeeperRoleFormValues {
  timekeeperId: string;
  roleId: string;
  billableRate: number;
}

interface WorkflowFormValues {
  name: string;
  instructions: string;
  trigger: "time_entry:batch_created";
}

export default function MatterSettingsPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;
  const queryClient = useQueryClient();

  // Team member modal state
  const [teamModalOpened, setTeamModalOpened] = useState(false);
  const [editingTeamMemberId, setEditingTeamMemberId] = useState<string | null>(
    null
  );

  // Workflow modal state
  const [workflowModalOpened, setWorkflowModalOpened] = useState(false);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(
    null
  );

  // Forms
  const teamForm = useForm<TimekeeperRoleFormValues>({
    initialValues: {
      timekeeperId: "",
      roleId: "",
      billableRate: 0,
    },
    validate: {
      timekeeperId: (value) => (!value ? "Timekeeper is required" : null),
      roleId: (value) => (!value ? "Role is required" : null),
      billableRate: (value) =>
        value <= 0 ? "Billable rate must be greater than 0" : null,
    },
  });

  const workflowForm = useForm<WorkflowFormValues>({
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

  // Queries
  const { data: matter, isLoading: matterLoading } = useQuery({
    queryKey: ["matter", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).get();
      if (response.error) throw new Error("Failed to fetch matter");
      return response.data;
    },
  });

  const { data: timekeeperRoles, isLoading: timekeeperRolesLoading } = useQuery(
    {
      queryKey: ["timekeeperRoles", matterId],
      queryFn: async () => {
        const matterApi = api.matters({ matterId });
        const response = await matterApi["timekeeper-roles"].get();
        if (response.error) throw new Error("Failed to fetch timekeeper roles");
        return response.data;
      },
    }
  );

  const { data: timekeepers, isLoading: timekeepersLoading } = useQuery({
    queryKey: ["timekeepers"],
    queryFn: async () => {
      const response = await api.timekeepers.get();
      if (response.error) throw new Error("Failed to fetch timekeepers");
      return response.data;
    },
  });

  const { data: roles, isLoading: rolesLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const response = await api.roles.get();
      if (response.error) throw new Error("Failed to fetch roles");
      return response.data;
    },
  });

  const { data: workflows, isLoading: workflowsLoading } = useQuery({
    queryKey: ["workflows", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).workflows.get();
      if (response.error) throw new Error("Failed to fetch workflows");
      return response.data;
    },
  });

  // Team member mutations
  const createTimekeeperRoleMutation = useMutation({
    mutationFn: async (values: TimekeeperRoleFormValues) => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["timekeeper-roles"].post(values);
      if (response.error) throw new Error("Failed to create timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member added successfully",
        color: "green",
      });
      setTeamModalOpened(false);
      teamForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to add team member",
        color: "red",
      });
    },
  });

  const updateTimekeeperRoleMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string;
      values: Partial<TimekeeperRoleFormValues>;
    }) => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["timekeeper-roles"]({
        roleId: id,
      }).patch(values);
      if (response.error) throw new Error("Failed to update timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member updated successfully",
        color: "green",
      });
      setTeamModalOpened(false);
      setEditingTeamMemberId(null);
      teamForm.reset();
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to update team member",
        color: "red",
      });
    },
  });

  const deleteTimekeeperRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const matterApi = api.matters({ matterId });
      const response = await matterApi["timekeeper-roles"]({ roleId }).delete();
      if (response.error) throw new Error("Failed to delete timekeeper role");
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timekeeperRoles"] });
      notifications.show({
        title: "Success",
        message: "Team member removed successfully",
        color: "green",
      });
    },
    onError: () => {
      notifications.show({
        title: "Error",
        message: "Failed to remove team member",
        color: "red",
      });
    },
  });

  // Workflow mutations
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
      setWorkflowModalOpened(false);
      workflowForm.reset();
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
      id,
      values,
    }: {
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
      setWorkflowModalOpened(false);
      setEditingWorkflowId(null);
      workflowForm.reset();
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
    mutationFn: async (id: string) => {
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

  // Handlers
  const handleEditTeamMember = (role: TimekeeperRole) => {
    setEditingTeamMemberId(role.id);
    teamForm.setValues({
      timekeeperId: role.timekeeperId,
      roleId: role.roleId,
      billableRate: role.billableRate,
    });
    setTeamModalOpened(true);
  };

  const handleDeleteTeamMember = (roleId: string) => {
    if (
      confirm(
        "Are you sure you want to remove this team member from the matter?"
      )
    ) {
      deleteTimekeeperRoleMutation.mutate(roleId);
    }
  };

  const handleTeamSubmit = (values: TimekeeperRoleFormValues) => {
    if (editingTeamMemberId) {
      updateTimekeeperRoleMutation.mutate({ id: editingTeamMemberId, values });
    } else {
      createTimekeeperRoleMutation.mutate(values);
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    setEditingWorkflowId(workflow.id);
    workflowForm.setValues({
      name: workflow.name,
      instructions: workflow.instructions,
      trigger: workflow.trigger as "time_entry:batch_created",
    });
    setWorkflowModalOpened(true);
  };

  const handleDeleteWorkflow = (id: string, name: string) => {
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
      onConfirm: () => deleteWorkflowMutation.mutate(id),
    });
  };

  const handleWorkflowSubmit = (values: WorkflowFormValues) => {
    if (editingWorkflowId) {
      updateWorkflowMutation.mutate({ id: editingWorkflowId, values });
    } else {
      createWorkflowMutation.mutate(values);
    }
  };

  // Data processing
  const timekeeperRolesArray = Array.isArray(timekeeperRoles)
    ? timekeeperRoles
    : [];
  const timekeepersArray = Array.isArray(timekeepers) ? timekeepers : [];
  const rolesArray = Array.isArray(roles) ? roles : [];
  const workflowsArray = Array.isArray(workflows) ? workflows : [];

  const timekeeperMap = new Map(timekeepersArray.map((tk) => [tk.id, tk.name]));
  const roleMap = new Map(rolesArray.map((r) => [r.id, r.name]));

  const isLoading =
    matterLoading ||
    timekeeperRolesLoading ||
    timekeepersLoading ||
    rolesLoading ||
    workflowsLoading;

  if (isLoading) {
    return (
      <Container size="xl">
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      </Container>
    );
  }

  return (
    <Container size="xl">
      <Group mb="xl">
        <IconSettings size={28} stroke={1.5} />
        <Title order={1}>Matter Settings</Title>
      </Group>

      <Stack gap="xl">
        {/* Matter Details Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">
            Matter Details
          </Title>
          <Stack gap="sm">
            <Group>
              <Text fw={500} w={120}>
                Client:
              </Text>
              <Text>{matter?.clientName}</Text>
            </Group>
            <Group>
              <Text fw={500} w={120}>
                Matter:
              </Text>
              <Text>{matter?.matterName}</Text>
            </Group>
            {matter?.description && (
              <Group align="flex-start">
                <Text fw={500} w={120}>
                  Description:
                </Text>
                <Text style={{ flex: 1 }}>{matter.description}</Text>
              </Group>
            )}
            <Group>
              <Text fw={500} w={120}>
                Created:
              </Text>
              <Text>
                {matter?.createdAt
                  ? new Date(matter.createdAt).toLocaleDateString()
                  : "-"}
              </Text>
            </Group>
          </Stack>
        </Paper>

        {/* Context Documents Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Title order={3} mb="md">
            Context Documents
          </Title>
          <Text size="sm" c="dimmed" mb="lg">
            Reference documents that provide context for AI-assisted billing
            reviews.
          </Text>
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {contextDocuments.map((doc) => {
              const Icon = getDocumentIcon(doc.type);
              const color = getDocumentColor(doc.type);
              return (
                <Card key={doc.id} shadow="xs" padding="md" withBorder>
                  <Group gap="md">
                    <ThemeIcon size="lg" variant="light" color={color}>
                      <Icon size={20} />
                    </ThemeIcon>
                    <div style={{ flex: 1 }}>
                      <Text fw={500} size="sm">
                        {doc.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {doc.description}
                      </Text>
                    </div>
                  </Group>
                </Card>
              );
            })}
          </SimpleGrid>
        </Paper>

        {/* Team Members Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Team Members</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingTeamMemberId(null);
                teamForm.reset();
                setTeamModalOpened(true);
              }}
              size="sm"
            >
              Add Team Member
            </Button>
          </Group>

          {timekeeperRolesArray.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No team members assigned to this matter yet.
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Timekeeper</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Billable Rate</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {timekeeperRolesArray.map((timekeeperRole: TimekeeperRole) => (
                  <Table.Tr key={timekeeperRole.id}>
                    <Table.Td>
                      <Text fw={500}>
                        {timekeeperMap.get(timekeeperRole.timekeeperId) ||
                          "Unknown"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {roleMap.get(timekeeperRole.roleId) || "Unknown"}
                    </Table.Td>
                    <Table.Td>£{timekeeperRole.billableRate}/hr</Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => handleEditTeamMember(timekeeperRole)}
                        >
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() =>
                            handleDeleteTeamMember(timekeeperRole.id)
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

        {/* Workflows Section */}
        <Paper shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>Workflows</Title>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                setEditingWorkflowId(null);
                workflowForm.reset();
                setWorkflowModalOpened(true);
              }}
              size="sm"
            >
              New Workflow
            </Button>
          </Group>

          {workflowsArray.length === 0 ? (
            <Text c="dimmed" ta="center" py="md">
              No workflows configured for this matter.
            </Text>
          ) : (
            <Accordion variant="separated">
              {workflowsArray.map((workflow: Workflow) => (
                <Accordion.Item key={workflow.id} value={workflow.id}>
                  <Accordion.Control>
                    <Group justify="space-between" pr="md">
                      <div>
                        <Text fw={500}>{workflow.name}</Text>
                        <Text size="xs" c="dimmed">
                          Created:{" "}
                          {new Date(workflow.createdAt).toLocaleDateString()}
                        </Text>
                      </div>
                      <Badge variant="light" color="blue">
                        {workflow.trigger.replace("_", " ").replace(":", ": ")}
                      </Badge>
                    </Group>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <Stack gap="md">
                      <div>
                        <Text size="sm" fw={500} mb="xs">
                          Instructions
                        </Text>
                        <Paper p="sm" bg="gray.0" radius="sm">
                          <Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
                            {workflow.instructions}
                          </Text>
                        </Paper>
                      </div>
                      <Divider />
                      <Group justify="flex-end" gap="xs">
                        <Button
                          variant="subtle"
                          size="xs"
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleEditWorkflow(workflow)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="subtle"
                          size="xs"
                          color="red"
                          leftSection={<IconTrash size={14} />}
                          onClick={() =>
                            handleDeleteWorkflow(workflow.id, workflow.name)
                          }
                        >
                          Delete
                        </Button>
                      </Group>
                    </Stack>
                  </Accordion.Panel>
                </Accordion.Item>
              ))}
            </Accordion>
          )}
        </Paper>
      </Stack>

      {/* Team Member Modal */}
      <Modal
        opened={teamModalOpened}
        onClose={() => {
          setTeamModalOpened(false);
          setEditingTeamMemberId(null);
          teamForm.reset();
        }}
        title={editingTeamMemberId ? "Edit Team Member" : "Add Team Member"}
      >
        <form onSubmit={teamForm.onSubmit(handleTeamSubmit)}>
          <Stack>
            <Select
              label="Timekeeper"
              placeholder="Select a timekeeper"
              data={timekeepersArray.map((tk) => ({
                value: tk.id,
                label: `${tk.name} (${tk.email})`,
              }))}
              required
              searchable
              disabled={!!editingTeamMemberId}
              {...teamForm.getInputProps("timekeeperId")}
            />
            <Select
              label="Role"
              placeholder="Select a role"
              data={rolesArray.map((r) => ({
                value: r.id,
                label: r.name,
              }))}
              required
              searchable
              {...teamForm.getInputProps("roleId")}
            />
            <NumberInput
              label="Billable Rate (per hour)"
              placeholder="Enter hourly rate"
              prefix="£"
              min={0}
              decimalScale={2}
              required
              {...teamForm.getInputProps("billableRate")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setTeamModalOpened(false);
                  setEditingTeamMemberId(null);
                  teamForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={
                  createTimekeeperRoleMutation.isPending ||
                  updateTimekeeperRoleMutation.isPending
                }
              >
                {editingTeamMemberId ? "Update" : "Add"} Team Member
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Workflow Modal */}
      <Modal
        opened={workflowModalOpened}
        onClose={() => {
          setWorkflowModalOpened(false);
          setEditingWorkflowId(null);
          workflowForm.reset();
        }}
        title={editingWorkflowId ? "Edit Workflow" : "Create New Workflow"}
        size="lg"
      >
        <form onSubmit={workflowForm.onSubmit(handleWorkflowSubmit)}>
          <Stack>
            <TextInput
              label="Name"
              placeholder="Time Entry Review Process"
              required
              {...workflowForm.getInputProps("name")}
            />
            <Textarea
              label="Instructions"
              placeholder="Natural language instructions for this workflow..."
              required
              minRows={6}
              {...workflowForm.getInputProps("instructions")}
            />
            <Group justify="flex-end">
              <Button
                variant="subtle"
                onClick={() => {
                  setWorkflowModalOpened(false);
                  setEditingWorkflowId(null);
                  workflowForm.reset();
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
                {editingWorkflowId ? "Update" : "Create"} Workflow
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Container>
  );
}
