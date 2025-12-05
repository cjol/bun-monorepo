import { Text, Tooltip } from "@mantine/core";

interface SuggestionDiffProps {
  oldValue: string | number | Date;
  newValue: string | number | Date;
  formatValue?: (value: string | number | Date) => string;
  explanation?: string;
}

/**
 * Component to display a diff between old and new values.
 * Shows old value with strikethrough and new value in green.
 * If values are the same, just shows the value.
 */
export function SuggestionDiff({
  oldValue,
  newValue,
  formatValue,
  explanation,
}: SuggestionDiffProps) {
  const format = (value: string | number | Date) => {
    if (formatValue) {
      return formatValue(value);
    }

    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value);
  };

  const formattedOld = format(oldValue);
  const formattedNew = format(newValue);

  // If values are the same, just show the value
  if (formattedOld === formattedNew) {
    return explanation ? (
      <Tooltip label={explanation} position="top" withArrow>
        <Text component="span">{formattedOld}</Text>
      </Tooltip>
    ) : (
      <Text>{formattedOld}</Text>
    );
  }

  const diffContent = (
    <span>
      <Text component="span" td="line-through" c="dimmed">
        {formattedOld}
      </Text>
      {" → "}
      <Text component="span" c="green" fw={500}>
        {formattedNew}
      </Text>
    </span>
  );

  return explanation ? (
    <Tooltip label={explanation} position="top" withArrow>
      {diffContent}
    </Tooltip>
  ) : (
    diffContent
  );
}
