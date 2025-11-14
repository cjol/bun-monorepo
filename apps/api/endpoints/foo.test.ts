import { describe, it, expect, beforeEach } from "bun:test";
import { testDB, mockFoos } from "@ai-starter/db/test-utils";
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

describe("Foo API endpoints", () => {
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

  describe("GET /foos/:id", () => {
    it("should return a foo when it exists", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos/foo-1")
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockFoos[0].id,
        name: mockFoos[0].name,
        createdAt: mockFoos[0].createdAt.toISOString(),
        updatedAt: mockFoos[0].updatedAt.toISOString(),
      });
    });

    it("should return 404 when foo does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos/non-existent-id")
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Foo with ID non-existent-id not found",
      });
    });
  });

  describe("POST /foos", () => {
    it("should create a new foo", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New Foo Item" }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        name: "New Foo Item",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should reject foo with name too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "ab" }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject foo without name", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("PATCH /foos/:id", () => {
    it("should update a foo's name", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos/foo-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: "foo-1",
        name: "Updated Name",
        createdAt: mockFoos[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should return 404 when foo does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Updated Name" }),
        })
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Foo with ID non-existent-id not found",
      });
    });

    it("should reject update with name too short", async () => {
      const response = await app.handle(
        new Request("http://localhost/foos/foo-1", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "ab" }),
        })
      );

      expect(response.status).toBe(422);
    });
  });
});
