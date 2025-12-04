import { describe, it, expect, beforeEach } from "bun:test";
import { documentTemplateRoutes } from "./document-templates";
import { getContext } from "../context";
import { testDB } from "@ai-starter/db/test-utils/db";

describe("documentTemplateRoutes", () => {
  let ctx: ReturnType<typeof getContext>;

  beforeEach(async () => {
    const db = await testDB({ seed: false });
    ctx = getContext("file:test.db");
  });

  describe("GET /document-templates", () => {
    it("should return empty list initially", async () => {
      const app = new Elysia().use(documentTemplateRoutes(ctx));

      const response = await app
        .handle(new Request("http://localhost/document-templates"))
        .then((res) => res.json());

      expect(response).toEqual([]);
    });
  });

  describe("POST /document-templates", () => {
    it("should create a new template", async () => {
      const app = new Elysia().use(documentTemplateRoutes(ctx));

      const templateData = {
        name: "New Template",
        outputFormat: "html",
        dataSchema: { type: "object" },
        templateCode: "return '<h1>Test</h1>';",
      };

      const response = await app
        .handle(
          new Request("http://localhost/document-templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(templateData),
          })
        )
        .then((res) => res.json());

      expect(response.name).toBe("New Template");
      expect(response.outputFormat).toBe("html");
    });
  });
});
