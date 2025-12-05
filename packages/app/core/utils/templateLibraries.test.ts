import { describe, it, expect } from "bun:test";
import {
  formatCurrency,
  formatPercentage,
  formatDate,
  htmlTemplate,
  csvEscape,
  csvRow,
  csvContent,
} from "./templateLibraries";

describe("templateLibraries", () => {
  describe("formatCurrency", () => {
    it("should format currency with default GBP", () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe("£1,234.56");
    });

    it("should format currency with custom currency", () => {
      const result = formatCurrency(1234.56, "EUR");
      expect(result).toContain("€");
    });
  });

  describe("formatPercentage", () => {
    it("should format percentage with default decimals", () => {
      const result = formatPercentage(0.1234);
      expect(result).toBe("12.3%");
    });

    it("should format percentage with custom decimals", () => {
      const result = formatPercentage(0.1234, 2);
      expect(result).toBe("12.34%");
    });
  });

  describe("formatDate", () => {
    it("should format date as short string", () => {
      const date = new Date("2025-01-15");
      const result = formatDate(date, "short");
      expect(result).toBe("15 Jan 2025");
    });

    it("should format date as long string", () => {
      const date = new Date("2025-01-15");
      const result = formatDate(date, "long");
      expect(result).toBe("15 January 2025");
    });

    it("should handle string dates", () => {
      const result = formatDate("2025-01-15", "short");
      expect(result).toBe("15 Jan 2025");
    });
  });

  describe("htmlTemplate", () => {
    it("should replace placeholders in template", () => {
      const template = "Hello {{name}}, you have {{count}} messages";
      const data = { name: "John", count: 5 };
      const result = htmlTemplate(template, data);
      expect(result).toBe("Hello John, you have 5 messages");
    });
  });

  describe("csvEscape", () => {
    it("should escape values with quotes and commas", () => {
      expect(csvEscape("Normal value")).toBe("Normal value");
      expect(csvEscape('Value with "quotes"')).toBe('"Value with ""quotes"""');
      expect(csvEscape("Value, with, commas")).toBe('"Value, with, commas"');
      expect(csvEscape("Value\nwith\nnewlines")).toBe(
        '"Value\nwith\nnewlines"'
      );
    });
  });

  describe("csvRow", () => {
    it("should create CSV row from values", () => {
      const values = ["Name", "John Doe", "Age", 30];
      const result = csvRow(values);
      expect(result).toBe("Name,John Doe,Age,30");
    });
  });

  describe("csvContent", () => {
    it("should create CSV content from headers and rows", () => {
      const headers = ["Name", "Age", "City"];
      const rows = [
        ["John Doe", 30, "New York"],
        ["Jane Smith", 25, "Los Angeles"],
      ];
      const result = csvContent(headers, rows);

      const expected =
        "Name,Age,City\nJohn Doe,30,New York\nJane Smith,25,Los Angeles";
      expect(result).toBe(expected);
    });
  });
});
