"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Container, Title, Group, Loader } from "@mantine/core";
import { api } from "../../../../lib/api";
import { DocumentsList } from "../../../../components/DocumentsList";

export default function DocumentsPage() {
  const params = useParams<{ matterId: string }>();
  const matterId = params.matterId;

  // Fetch all documents for this matter
  const { data: documents, isLoading } = useQuery({
    queryKey: ["documents", matterId],
    queryFn: async () => {
      const response = await api.matters({ matterId }).documents.get();
      if (response.error) throw new Error("Failed to fetch documents");
      return response.data;
    },
  });

  return (
    <Container size="xl">
      <Group justify="space-between" mb="xl">
        <Title order={1}>Documents</Title>
      </Group>

      {isLoading ? (
        <Group justify="center" p="xl">
          <Loader />
        </Group>
      ) : (
        <DocumentsList
          documents={documents || []}
          isLoading={isLoading}
          matterId={matterId}
        />
      )}
    </Container>
  );
}
