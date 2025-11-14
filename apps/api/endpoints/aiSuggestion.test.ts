import { describe, it, expect, beforeEach } from "bun:test";
import {
  testDB,
  mockAiSuggestions,
  mockTimeEntries,
} from "@ai-starter/db/test-utils";
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

describe("AiSuggestion API endpoints", () => {
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

  describe("POST /ai-suggestions", () => {
    it("should create a new ai suggestion", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeEntryId: mockTimeEntries[0].id,
            messageId: "00000000-0000-4000-8000-000000000011",
            suggestedChanges: { description: "Updated description" },
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        timeEntryId: mockTimeEntries[0].id,
        messageId: "00000000-0000-4000-8000-000000000011",
        suggestedChanges: { description: "Updated description" },
        status: "pending",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should reject suggestion without timeEntryId", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messageId: "00000000-0000-4000-8000-000000000011",
            suggestedChanges: { description: "Updated description" },
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject suggestion without messageId", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeEntryId: mockTimeEntries[0].id,
            suggestedChanges: { description: "Updated description" },
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("POST /ai-suggestions/:id/approve", () => {
    it("should approve a pending suggestion", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/ai-suggestions/00000000-0000-4000-8000-000000000301/approve",
          {
            method: "POST",
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockAiSuggestions[0].id,
        timeEntryId: mockAiSuggestions[0].timeEntryId,
        messageId: mockAiSuggestions[0].messageId,
        suggestedChanges: mockAiSuggestions[0].suggestedChanges,
        status: "approved",
        createdAt: mockAiSuggestions[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should return 404 when suggestion does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions/non-existent-id/approve", {
          method: "POST",
        })
      );

      expect(response.status).toBe(404);
    });

    it("should return 400 when trying to approve already approved suggestion", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/ai-suggestions/00000000-0000-4000-8000-000000000302/approve",
          {
            method: "POST",
          }
        )
      );

      expect(response.status).toBe(400);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("error", "Bad Request");
    });
  });

  describe("POST /ai-suggestions/:id/reject", () => {
    it("should reject a pending suggestion", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/ai-suggestions/00000000-0000-4000-8000-000000000301/reject",
          {
            method: "POST",
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockAiSuggestions[0].id,
        timeEntryId: mockAiSuggestions[0].timeEntryId,
        messageId: mockAiSuggestions[0].messageId,
        suggestedChanges: mockAiSuggestions[0].suggestedChanges,
        status: "rejected",
        createdAt: mockAiSuggestions[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should return 404 when suggestion does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions/non-existent-id/reject", {
          method: "POST",
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /ai-suggestions?timeEntryId=xxx", () => {
    it("should list suggestions by time entry", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/ai-suggestions?timeEntryId=00000000-0000-4000-8000-000000000201"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });

    it("should return empty array for time entry with no suggestions", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/ai-suggestions?timeEntryId=non-existent-entry"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe("GET /ai-suggestions?status=xxx", () => {
    it("should list suggestions by status pending", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions?status=pending")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });

    it("should list suggestions by status approved", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions?status=approved")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(1);
    });

    it("should return empty array for rejected status", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions?status=rejected")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe("GET /ai-suggestions without query params", () => {
    it("should return 400 when no query parameters provided", async () => {
      const response = await app.handle(
        new Request("http://localhost/ai-suggestions")
      );

      expect(response.status).toBe(400);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("error");
    });
  });
});
