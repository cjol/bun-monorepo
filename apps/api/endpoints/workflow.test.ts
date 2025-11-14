import { describe, it, expect, beforeEach } from "bun:test";
import { testDB, mockWorkflows } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import {
  CoreAppService,
  MatterService,
  BillService,
  TimeEntryService,
  AiSuggestionService,
  WorkflowService,
} from "@ai-starter/app";
import { getApp } from "..";

describe("Workflow API endpoints", () => {
  let db: DB;
  let app: ReturnType<typeof getApp>;

  beforeEach(async () => {
    db = await testDB();

    const repos = getRepos(db);
    app = getApp({
      app: {
        foo: CoreAppService({ repos }),
        matter: MatterService({ repos }),
        bill: BillService({ repos }),
        timeEntry: TimeEntryService({ repos }),
        aiSuggestion: AiSuggestionService({ repos }),
        workflow: WorkflowService({ repos }),
      },
    });
  });

  describe("GET /workflows", () => {
    it("should list all workflows", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });
  });

  describe("GET /workflows/:id", () => {
    it("should return a workflow when it exists", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/workflows/00000000-0000-4000-8000-000000000401"
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockWorkflows[0].id,
        name: mockWorkflows[0].name,
        instructions: mockWorkflows[0].instructions,
        createdAt: mockWorkflows[0].createdAt.toISOString(),
        updatedAt: mockWorkflows[0].updatedAt.toISOString(),
      });
    });

    it("should return 404 when workflow does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows/non-existent-id")
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Workflow with ID non-existent-id not found",
      });
    });
  });

  describe("POST /workflows", () => {
    it("should create a new workflow", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Workflow",
            instructions: "Do something useful",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        name: "New Workflow",
        instructions: "Do something useful",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should reject workflow without name", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructions: "Do something useful",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject workflow without instructions", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "New Workflow",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("PATCH /workflows/:id", () => {
    it("should update a workflow's name", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/workflows/00000000-0000-4000-8000-000000000401",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "Updated Workflow Name" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: "00000000-0000-4000-8000-000000000401",
        name: "Updated Workflow Name",
        instructions: mockWorkflows[0].instructions,
        createdAt: mockWorkflows[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should update a workflow's instructions", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/workflows/00000000-0000-4000-8000-000000000401",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ instructions: "Updated instructions" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("instructions", "Updated instructions");
    });

    it("should return 404 when workflow does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Workflow with ID non-existent-id not found",
      });
    });
  });

  describe("DELETE /workflows/:id", () => {
    it("should delete a workflow", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/workflows/00000000-0000-4000-8000-000000000401",
          {
            method: "DELETE",
          }
        )
      );

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await app.handle(
        new Request(
          "http://localhost/workflows/00000000-0000-4000-8000-000000000401"
        )
      );
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when workflow does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/workflows/non-existent-id", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Workflow with ID non-existent-id not found",
      });
    });
  });
});
