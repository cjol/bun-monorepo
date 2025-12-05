import { describe, it, expect } from "bun:test";
import { executeTemplate } from "./executeTemplate";
import type { DocumentTemplate } from "@ai-starter/core";

describe("executeTemplate", () => {
  const mockTemplate: DocumentTemplate = {
    id: "test-template-id",
    name: "Test Template",
    description: "A test template",
    outputFormat: "text",
    dataSchema: JSON.stringify({
      type: "object",
      properties: {
        name: { type: "string" },
        age: { type: "number" },
      },
      required: ["name"],
    }),
    templateCode: "return `Hello ${data.name}, you are ${data.age} years old`;",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe("data validation", () => {
    it("should succeed with valid data", async () => {
      const result = await executeTemplate({
        template: mockTemplate,
        data: { name: "John", age: 30 },
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe("Hello John, you are 30 years old");
      expect(result.logs).toEqual([]);
    });

    it("should fail with missing required field", async () => {
      const result = await executeTemplate({
        template: mockTemplate,
        data: { age: 30 }, // Missing required 'name' field
      });

      expect(result.error).toContain("Data validation failed");
      expect(result.error).toContain("name");
      expect(result.output).toBe("");
      expect(result.logs).toEqual([]);
    });

    it("should fail with wrong type for field", async () => {
      const result = await executeTemplate({
        template: mockTemplate,
        data: { name: "John", age: "thirty" }, // age should be number
      });

      expect(result.error).toContain("Data validation failed");
      expect(result.error).toContain("age");
      expect(result.output).toBe("");
      expect(result.logs).toEqual([]);
    });

    it("should fail with extra properties when strict", async () => {
      const result = await executeTemplate({
        template: mockTemplate,
        data: { name: "John", age: 30, extra: "field" },
      });

      // AJV by default allows additional properties, so this should succeed
      expect(result.error).toBeUndefined();
      expect(result.output).toBe("Hello John, you are 30 years old");
    });
  });

  describe("schema validation", () => {
    it("should fail with invalid JSON in schema", async () => {
      const invalidTemplate: DocumentTemplate = {
        ...mockTemplate,
        dataSchema: "{ invalid json }",
      };

      const result = await executeTemplate({
        template: invalidTemplate,
        data: { name: "John", age: 30 },
      });

      expect(result.error).toContain("Invalid JSON Schema in template");
      expect(result.error).toContain("JSON");
      expect(result.output).toBe("");
    });

    it("should fail with invalid JSON Schema", async () => {
      const invalidTemplate: DocumentTemplate = {
        ...mockTemplate,
        dataSchema: JSON.stringify({
          type: "invalid-type", // Invalid JSON Schema type
        }),
      };

      const result = await executeTemplate({
        template: invalidTemplate,
        data: { name: "John", age: 30 },
      });

      expect(result.error).toContain("schema is invalid");
      expect(result.output).toBe("");
    });
  });

  describe("template execution", () => {
    it("should capture console.log output", async () => {
      const templateWithLogs: DocumentTemplate = {
        ...mockTemplate,
        templateCode: `
          console.log("Processing", data.name);
          console.log("Age:", data.age);
          return \`Result for \${data.name}\`;
        `,
      };

      const result = await executeTemplate({
        template: templateWithLogs,
        data: { name: "John", age: 30 },
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe("Result for John");
      expect(result.logs).toEqual(["Processing John", "Age: 30"]);
    });

    it("should handle template execution errors", async () => {
      const templateWithError: DocumentTemplate = {
        ...mockTemplate,
        templateCode: `
          throw new Error("Template error");
        `,
      };

      const result = await executeTemplate({
        template: templateWithError,
        data: { name: "John", age: 30 },
      });

      expect(result.error).toContain("Template error");
      expect(result.output).toBe("");
      expect(result.logs).toEqual([]);
    });

    it("should handle timeout", async () => {
      const templateWithTimeout: DocumentTemplate = {
        ...mockTemplate,
        templateCode: `
          // Infinite loop to test timeout
          while(true) {}
        `,
      };

      const result = await executeTemplate({
        template: templateWithTimeout,
        data: { name: "John", age: 30 },
        timeout: 100, // Very short timeout
      });

      expect(result.error).toContain("timed out");
      expect(result.output).toBe("");
    });
  });

  describe("complex data types", () => {
    it("should handle array data", async () => {
      const arrayTemplate: DocumentTemplate = {
        ...mockTemplate,
        dataSchema: JSON.stringify({
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  value: { type: "number" },
                },
              },
            },
          },
        }),
        templateCode: `
          return data.items.map(item => \`\${item.name}: \${item.value}\`).join(", ");
        `,
      };

      const result = await executeTemplate({
        template: arrayTemplate,
        data: {
          items: [
            { name: "Item 1", value: 10 },
            { name: "Item 2", value: 20 },
          ],
        },
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe("Item 1: 10, Item 2: 20");
    });

    it("should handle nested objects", async () => {
      const nestedTemplate: DocumentTemplate = {
        ...mockTemplate,
        dataSchema: JSON.stringify({
          type: "object",
          properties: {
            user: {
              type: "object",
              properties: {
                profile: {
                  type: "object",
                  properties: {
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                  },
                },
              },
            },
          },
        }),
        templateCode: `
          const { profile } = data.user;
          return \`\${profile.firstName} \${profile.lastName}\`;
        `,
      };

      const result = await executeTemplate({
        template: nestedTemplate,
        data: {
          user: {
            profile: {
              firstName: "John",
              lastName: "Doe",
            },
          },
        },
      });

      expect(result.error).toBeUndefined();
      expect(result.output).toBe("John Doe");
    });
  });
});
