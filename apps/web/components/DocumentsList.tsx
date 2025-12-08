"use client";

import {
  Table,
  ActionIcon,
  Text,
  Group,
  Loader,
  Paper,
  Title,
} from "@mantine/core";
import {
  IconDownload,
  IconFile,
  IconFileTypePdf,
  IconFileTypeDocx,
  IconFileText,
} from "@tabler/icons-react";
import type { Document } from "@ai-starter/core";

interface DocumentsListProps {
  documents: Document[];
  isLoading?: boolean;
  matterId: string;
}

export function DocumentsList({
  documents,
  isLoading,
  matterId,
}: DocumentsListProps) {
  const getFileIcon = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return <IconFileTypePdf size={20} color="#FF3B30" />;
    }
    if (mimeType.includes("spreadsheetml")) {
      return <IconFileTypeDocx size={20} color="#34C759" />;
    }
    if (mimeType.startsWith("text/")) {
      return <IconFileText size={20} color="#007AFF" />;
    }
    return <IconFile size={20} color="#8E8E93" />;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const handleDownload = (documentId: string, fileName: string) => {
    const url = `/api/matters/${matterId}/documents/${documentId}/download`;
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Group justify="center" p="xl">
        <Loader />
      </Group>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <Text c="dimmed" ta="center" py="xl">
        No documents found.
      </Text>
    );
  }

  const rows = documents.map((document) => (
    <Table.Tr key={document.id}>
      <Table.Td>
        <Group gap="sm">
          {getFileIcon(document.mimeType)}
          <Text size="sm" fw={500}>
            {document.name}
          </Text>
        </Group>
      </Table.Td>
      <Table.Td>
        <Text size="sm" c="dimmed">
          {formatDate(document.createdAt)}
        </Text>
      </Table.Td>
      <Table.Td>
        <ActionIcon
          variant="subtle"
          color="blue"
          onClick={() => handleDownload(document.id, document.name)}
          title="Download document"
        >
          <IconDownload size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <Paper shadow="sm" p="md" radius="md" withBorder>
      <Title order={2} mb="md">
        Documents
      </Title>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th></Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}
