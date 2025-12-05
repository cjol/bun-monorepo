/**
 * Template library utilities for document generation.
 * These are injected into the template execution sandbox.
 */

/**
 * Format a number as currency
 */
export const formatCurrency = (amount: number, currency = "GBP"): string => {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
};

/**
 * Format a number as percentage
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return `${(value * 100).toFixed(decimals)}%`;
};

/**
 * Format a date
 */
export const formatDate = (
  date: Date | string,
  format: "long" | "numeric" | "2-digit" | "short" | "narrow" = "long"
): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleDateString("en-GB", {
    year: "numeric",
    month: format,
    day: "numeric",
  });
};

/**
 * Simple HTML template helper
 */
export const htmlTemplate = (
  template: string,
  data: Record<string, unknown>
): string => {
  let result = template;

  for (const [key, value] of Object.entries(data)) {
    const placeholder = `{{${key}}}`;
    result = result.replace(new RegExp(placeholder, "g"), String(value));
  }

  return result;
};

/**
 * CSV escape helper
 */
export const csvEscape = (value: string): string => {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

/**
 * Generate CSV row
 */
export const csvRow = (values: unknown[]): string => {
  return values.map((v) => csvEscape(String(v))).join(",");
};

/**
 * Generate CSV content
 */
export const csvContent = (headers: string[], rows: unknown[][]): string => {
  const headerRow = csvRow(headers);
  const dataRows = rows.map((row) => csvRow(row));
  return [headerRow, ...dataRows].join("\n");
};
