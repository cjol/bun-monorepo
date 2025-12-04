import { ActionIcon, Text, Tooltip } from "@mantine/core";
import { IconArrowsExchange } from "@tabler/icons-react";

interface SuggestionCyclerProps {
  currentIndex: number;
  totalCount: number;
  onCycle: () => void;
}

/**
 * Component to display and cycle through multiple suggestions for a time entry.
 * Shows "current/total" with an icon to indicate it's for cycling suggestions.
 */
export function SuggestionCycler({
  currentIndex,
  totalCount,
  onCycle,
}: SuggestionCyclerProps) {
  if (totalCount <= 1) {
    return null;
  }

  return (
    <Tooltip label="Cycle through suggestions">
      <ActionIcon variant="subtle" size="sm" onClick={onCycle}>
        <IconArrowsExchange size={12} />
        <Text size="xs" ml={2}>
          {currentIndex + 1}/{totalCount}
        </Text>
      </ActionIcon>
    </Tooltip>
  );
}
