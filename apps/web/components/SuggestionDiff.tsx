import { Text } from "@mantine/core";

interface SuggestionDiffProps {
  oldValue: string | number | Date;
  newValue: string | number | Date;
  formatValue?: (value: string | number | Date) => string;
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
    return <Text>{formattedOld}</Text>;
  }

  return (
    <>
      <Text component="span" td="line-through" c="dimmed">
        {formattedOld}
      </Text>
      {" → "}
      <Text component="span" c="green" fw={500}>
        {formattedNew}
      </Text>
    </>
  );
}
