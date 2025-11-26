import { describe, it, expect, beforeEach } from "bun:test";
import { testDB, mockBills, mockMatters } from "@ai-starter/db/test-utils";
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

describe("Bill API endpoints", () => {
  let db: DB;
  let app: ReturnType<typeof getApp>;

  beforeEach(async () => {
    db = await testDB();

    const repos = getRepos(db);
    const timeEntry = TimeEntryService({ repos });
    app = getApp({
      app: {
        foo: CoreAppService({ repos }),
        matter: MatterService({ repos }),
        bill: BillService({ repos }),
        timeEntry,
        aiSuggestion: AiSuggestionService({ repos, services: { timeEntry } }),
        workflow: WorkflowService({ repos }),
      },
    });
  });

  describe("GET /bills/:id", () => {
    it("should return a bill when it exists", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/bills/00000000-0000-4000-8000-000000000101"
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockBills[0].id,
        matterId: mockBills[0].matterId,
        periodStart: mockBills[0].periodStart.toISOString(),
        periodEnd: mockBills[0].periodEnd.toISOString(),
        status: mockBills[0].status,
        createdAt: mockBills[0].createdAt.toISOString(),
        updatedAt: mockBills[0].updatedAt.toISOString(),
      });
    });

    it("should return 404 when bill does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills/non-existent-id")
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "Bill with ID non-existent-id not found",
      });
    });
  });

  describe("POST /bills", () => {
    it("should create a new bill", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterId: mockMatters[0].id,
            periodStart: "2024-03-01T00:00:00.000Z",
            periodEnd: "2024-03-31T00:00:00.000Z",
            status: "draft",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body = await response.json();
      expect(body).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        matterId: mockMatters[0].id,
        periodStart: "2024-03-01T00:00:00.000Z",
        periodEnd: "2024-03-31T00:00:00.000Z",
        status: "draft",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should reject bill without matterId", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            periodStart: "2024-03-01T00:00:00.000Z",
            periodEnd: "2024-03-31T00:00:00.000Z",
            status: "draft",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject bill with invalid status", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterId: mockMatters[0].id,
            periodStart: "2024-03-01T00:00:00.000Z",
            periodEnd: "2024-03-31T00:00:00.000Z",
            status: "invalid-status",
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("PATCH /bills/:id", () => {
    it("should update a bill's status", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/bills/00000000-0000-4000-8000-000000000101",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "finalized" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: "00000000-0000-4000-8000-000000000101",
        matterId: mockBills[0].matterId,
        periodStart: mockBills[0].periodStart.toISOString(),
        periodEnd: mockBills[0].periodEnd.toISOString(),
        status: "finalized",
        createdAt: mockBills[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should return 404 when bill does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "finalized" }),
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe("DELETE /bills/:id", () => {
    it("should delete a bill", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/bills/00000000-0000-4000-8000-000000000101",
          {
            method: "DELETE",
          }
        )
      );

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await app.handle(
        new Request(
          "http://localhost/bills/00000000-0000-4000-8000-000000000101"
        )
      );
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when bill does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills/non-existent-id", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(404);
    });
  });

  describe("GET /bills?matterId=xxx", () => {
    it("should list bills by matter", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/bills?matterId=00000000-0000-4000-8000-000000000001"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it("should return empty array for matter with no bills", async () => {
      const response = await app.handle(
        new Request("http://localhost/bills?matterId=non-existent-matter")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });
});
