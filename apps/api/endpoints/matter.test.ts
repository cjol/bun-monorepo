import { describe, it, expect, beforeEach } from "bun:test";
import { testDB, mockMatters } from "@ai-starter/db/test-utils";
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

describe("Matter API endpoints", () => {
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

  describe("GET /matters/:id", () => {
    it("should return a matter when it exists", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/matters/00000000-0000-4000-8000-000000000001"
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockMatters[0].id,
        clientName: mockMatters[0].clientName,
        matterName: mockMatters[0].matterName,
        description: mockMatters[0].description,
        createdAt: mockMatters[0].createdAt.toISOString(),
        updatedAt: mockMatters[0].updatedAt.toISOString(),
      });
    });

    it("should return 404 when matter does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters/non-existent-id")
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Matter with ID non-existent-id not found",
      });
    });
  });

  describe("POST /matters", () => {
    it("should create a new matter", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: "New Client",
            matterName: "New Matter",
            description: "Test description",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        clientName: "New Client",
        matterName: "New Matter",
        description: "Test description",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should reject matter without clientName", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterName: "New Matter",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should accept matter with null description", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientName: "New Client",
            matterName: "New Matter",
            description: null,
          }),
        })
      );

      expect(response.status).toBe(201);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("description", null);
    });
  });

  describe("PATCH /matters/:id", () => {
    it("should update a matter's clientName", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/matters/00000000-0000-4000-8000-000000000001",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientName: "Updated Client" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: "00000000-0000-4000-8000-000000000001",
        clientName: "Updated Client",
        matterName: mockMatters[0].matterName,
        description: mockMatters[0].description,
        createdAt: mockMatters[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should update a matter's matterName", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/matters/00000000-0000-4000-8000-000000000001",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ matterName: "Updated Matter" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("matterName", "Updated Matter");
    });

    it("should return 404 when matter does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientName: "Updated Client" }),
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Matter with ID non-existent-id not found",
      });
    });
  });

  describe("DELETE /matters/:id", () => {
    it("should delete a matter", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/matters/00000000-0000-4000-8000-000000000001",
          {
            method: "DELETE",
          }
        )
      );

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await app.handle(
        new Request(
          "http://localhost/matters/00000000-0000-4000-8000-000000000001"
        )
      );
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when matter does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/matters/non-existent-id", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Matter with ID non-existent-id not found",
      });
    });
  });
});
