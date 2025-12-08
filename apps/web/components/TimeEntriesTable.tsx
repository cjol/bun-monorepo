"use client";

import { Table, Group, Text, ActionIcon } from "@mantine/core";
import {
  IconEdit,
  IconTrash,
  IconRobot,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import type { ActivityLog, AiSuggestion, Timekeeper } from "@ai-starter/core";
import type { EnrichedTimeEntry } from "../hooks/useEnrichedTimeEntries";
import { formatCurrency } from "../hooks/useEnrichedTimeEntries";
import { SuggestionDiff } from "./SuggestionDiff";
import { SuggestionCycler } from "./SuggestionCycler";

interface TimeEntriesTableProps {
  enrichedTimeEntries: EnrichedTimeEntry[];
  metadataFields: {
    key: string;
    label: string;
    type: "string" | "number" | "enum";
    values?: { value: string; name: string }[];
  }[];
  suggestionsByTimeEntry: Map<string, AiSuggestion[]>;
  suggestionIndices: Record<string, number>;
  onCycleSuggestion: (timeEntryId: string) => void;
  onApproveSuggestion: (suggestionId: string) => void;
  onRejectSuggestion: (suggestionId: string) => void;
  onViewActivities: (activities: ActivityLog[]) => void;
  isApprovePending: boolean;
  isRejectPending: boolean;
  timekeepers?: Timekeeper[];
}

export function TimeEntriesTable({
  enrichedTimeEntries,
  metadataFields,
  suggestionsByTimeEntry,
  suggestionIndices,
  onCycleSuggestion,
  onApproveSuggestion,
  onRejectSuggestion,
  onViewActivities,
  isApprovePending,
  isRejectPending,
  timekeepers = [],
}: TimeEntriesTableProps) {
  const getActivityIconColor = (activities: ActivityLog[]) => {
    if (activities.some((activity) => activity.status === "running"))
      return "green";
    if (activities.some((activity) => activity.status === "failed"))
      return "red";
    if (activities.some((activity) => activity.status === "completed"))
      return "blue";
    return "gray";
  };

  // Helper to get the current suggestion for a time entry
  const getCurrentSuggestion = (
    timeEntryId: string
  ): AiSuggestion | undefined => {
    const list = suggestionsByTimeEntry.get(timeEntryId);
    if (!list || list.length === 0) return undefined;
    const index = suggestionIndices[timeEntryId] || 0;
    return list[index];
  };

  // Helper to get timekeeper name by ID
  const getTimekeeperName = (timekeeperId: string): string => {
    const timekeeper = timekeepers.find((tk) => tk.id === timekeeperId);
    return timekeeper?.name || "Unknown";
  };

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Timekeeper</Table.Th>
          <Table.Th>Role</Table.Th>
          <Table.Th>Rate</Table.Th>
          <Table.Th>Hours</Table.Th>
          <Table.Th>Description</Table.Th>
          {metadataFields.map((field) => (
            <Table.Th key={field.key}>{field.label}</Table.Th>
          ))}
          <Table.Th>Actions</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {enrichedTimeEntries.map((entry: EnrichedTimeEntry) => {
          const suggestion = getCurrentSuggestion(entry.id);
          const suggestionsList = suggestionsByTimeEntry.get(entry.id);
          const currentSuggestionIndex = suggestionIndices[entry.id] || 0;

          return (
            <Table.Tr
              key={entry.id}
              style={{
                borderLeft: suggestion
                  ? "4px solid var(--mantine-color-yellow-6)"
                  : undefined,
              }}
            >
              <Table.Td>
                {suggestion &&
                suggestion.suggestedChanges.date !== entry.date ? (
                  <SuggestionDiff
                    oldValue={entry.date}
                    newValue={suggestion.suggestedChanges.date}
                    formatValue={(date) => new Date(date).toLocaleDateString()}
                    explanation={suggestion.explanation}
                  />
                ) : (
                  new Date(entry.date).toLocaleDateString()
                )}
              </Table.Td>
              <Table.Td>
                {suggestion &&
                suggestion.suggestedChanges.timekeeperId !==
                  entry.timekeeperId ? (
                  <SuggestionDiff
                    oldValue={entry.timekeeperName}
                    newValue={getTimekeeperName(
                      suggestion.suggestedChanges.timekeeperId
                    )}
                    explanation={suggestion.explanation}
                  />
                ) : (
                  <Text fw={500}>{entry.timekeeperName}</Text>
                )}
              </Table.Td>
              <Table.Td>
                <Text>{entry.roleName}</Text>
              </Table.Td>
              <Table.Td>
                <Text>{formatCurrency(entry.billableRate)}</Text>
              </Table.Td>
              <Table.Td>
                {suggestion &&
                suggestion.suggestedChanges.hours !== entry.hours ? (
                  <SuggestionDiff
                    oldValue={entry.hours}
                    newValue={suggestion.suggestedChanges.hours}
                    explanation={suggestion.explanation}
                  />
                ) : (
                  <Text fw={500}>{entry.hours}</Text>
                )}
              </Table.Td>
              <Table.Td>
                {suggestion &&
                suggestion.suggestedChanges.description !==
                  entry.description ? (
                  <SuggestionDiff
                    oldValue={entry.description}
                    newValue={suggestion.suggestedChanges.description}
                    explanation={suggestion.explanation}
                  />
                ) : (
                  <Text lineClamp={2}>{entry.description}</Text>
                )}
              </Table.Td>
              {metadataFields.map((field) => {
                const metadata = entry.metadata as Record<string, string>;
                const value = metadata[field.key];
                let displayValue = value || "-";

                // For enum fields, show the readable name instead of the raw value
                if (field.type === "enum" && value) {
                  const enumOption = field.values?.find(
                    (v) => v.value === value
                  );
                  displayValue = enumOption?.name || value;
                }

                // Check if there's a suggestion for this metadata field
                const suggestedMetadata = suggestion?.suggestedChanges
                  .metadata as Record<string, string>;
                const suggestedValue = suggestedMetadata?.[field.key];
                let suggestedDisplayValue = suggestedValue || "-";

                if (field.type === "enum" && suggestedValue) {
                  const enumOption = field.values?.find(
                    (v) => v.value === suggestedValue
                  );
                  suggestedDisplayValue = enumOption?.name || suggestedValue;
                }

                const hasMetadataDiff = suggestion && suggestedValue !== value;

                return (
                  <Table.Td key={field.key}>
                    {hasMetadataDiff ? (
                      <SuggestionDiff
                        oldValue={displayValue}
                        newValue={suggestedDisplayValue}
                        explanation={suggestion?.explanation}
                      />
                    ) : (
                      <Text>{displayValue}</Text>
                    )}
                  </Table.Td>
                );
              })}
              <Table.Td>
                <Group gap="xs">
                  {suggestion && (
                    <>
                      {/* Suggestion cycler if multiple suggestions */}
                      {suggestionsList && suggestionsList.length > 1 && (
                        <SuggestionCycler
                          currentIndex={currentSuggestionIndex}
                          totalCount={suggestionsList.length}
                          onCycle={() => onCycleSuggestion(entry.id)}
                        />
                      )}
                      {/* Approve button */}
                      <ActionIcon
                        variant="subtle"
                        color="green"
                        onClick={() => onApproveSuggestion(suggestion.id)}
                        loading={isApprovePending}
                      >
                        <IconCheck size={16} />
                      </ActionIcon>
                      {/* Reject button */}
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => onRejectSuggestion(suggestion.id)}
                        loading={isRejectPending}
                      >
                        <IconX size={16} />
                      </ActionIcon>
                    </>
                  )}
                  {entry.activities && entry.activities.length > 0 && (
                    <ActionIcon
                      variant="subtle"
                      color={getActivityIconColor(entry.activities)}
                      onClick={() => {
                        onViewActivities(entry.activities || []);
                      }}
                    >
                      <IconRobot size={16} />
                    </ActionIcon>
                  )}
                  <ActionIcon variant="subtle">
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon variant="subtle" color="red">
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
}
