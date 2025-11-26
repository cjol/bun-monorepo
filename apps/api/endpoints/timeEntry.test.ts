import { describe, it, expect, beforeEach } from "bun:test";
import {
  testDB,
  mockTimeEntries,
  mockMatters,
  mockBills,
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

describe("TimeEntry API endpoints", () => {
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

  describe("GET /time-entries/:id", () => {
    it("should return a time entry when it exists", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries/00000000-0000-4000-8000-000000000201"
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: mockTimeEntries[0].id,
        matterId: mockTimeEntries[0].matterId,
        billId: mockTimeEntries[0].billId,
        date: mockTimeEntries[0].date.toISOString(),
        hours: mockTimeEntries[0].hours,
        description: mockTimeEntries[0].description,
        createdAt: mockTimeEntries[0].createdAt.toISOString(),
        updatedAt: mockTimeEntries[0].updatedAt.toISOString(),
      });
    });

    it("should return 404 when time entry does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries/non-existent-id")
      );

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "TimeEntry with ID non-existent-id not found",
      });
    });
  });

  describe("POST /time-entries", () => {
    it("should create a new time entry", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterId: mockMatters[0].id,
            billId: mockBills[0].id,
            date: "2024-03-15T00:00:00.000Z",
            hours: 3.5,
            description: "New time entry",
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
        billId: mockBills[0].id,
        date: "2024-03-15T00:00:00.000Z",
        hours: 3.5,
        description: "New time entry",
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it("should create a time entry with null billId", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterId: mockMatters[0].id,
            billId: null,
            date: "2024-03-15T00:00:00.000Z",
            hours: 2.0,
            description: "Unbilled time",
          }),
        })
      );

      expect(response.status).toBe(201);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("billId", null);
    });

    it("should reject time entry without matterId", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: "2024-03-15T00:00:00.000Z",
            hours: 3.5,
            description: "New time entry",
          }),
        })
      );

      expect(response.status).toBe(422);
    });

    it("should reject time entry without description", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matterId: mockMatters[0].id,
            billId: null,
            date: "2024-03-15T00:00:00.000Z",
            hours: 3.5,
          }),
        })
      );

      expect(response.status).toBe(422);
    });
  });

  describe("PATCH /time-entries/:id", () => {
    it("should update a time entry's hours", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries/00000000-0000-4000-8000-000000000201",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ hours: 5.0 }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body).toEqual({
        id: "00000000-0000-4000-8000-000000000201",
        matterId: mockTimeEntries[0].matterId,
        billId: mockTimeEntries[0].billId,
        date: mockTimeEntries[0].date.toISOString(),
        hours: 5.0,
        description: mockTimeEntries[0].description,
        createdAt: mockTimeEntries[0].createdAt.toISOString(),
        updatedAt: expect.any(String),
      });
    });

    it("should update a time entry's description", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries/00000000-0000-4000-8000-000000000201",
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ description: "Updated description" }),
          }
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("description", "Updated description");
    });

    it("should return 404 when time entry does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries/non-existent-id", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hours: 5.0 }),
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "TimeEntry with id non-existent-id not found",
      });
    });
  });

  describe("DELETE /time-entries/:id", () => {
    it("should delete a time entry", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries/00000000-0000-4000-8000-000000000201",
          {
            method: "DELETE",
          }
        )
      );

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await app.handle(
        new Request(
          "http://localhost/time-entries/00000000-0000-4000-8000-000000000201"
        )
      );
      expect(getResponse.status).toBe(404);
    });

    it("should return 404 when time entry does not exist", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries/non-existent-id", {
          method: "DELETE",
        })
      );

      expect(response.status).toBe(404);
      const body: unknown = await response.json();
      expect(body).toEqual({
        error: "Not Found",
        message: "TimeEntry with ID non-existent-id not found",
      });
    });
  });

  describe("GET /time-entries?matterId=xxx", () => {
    it("should list time entries by matter", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries?matterId=00000000-0000-4000-8000-000000000001"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it("should return empty array for matter with no time entries", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries?matterId=non-existent-matter"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe("GET /time-entries?billId=xxx", () => {
    it("should list time entries by bill", async () => {
      const response = await app.handle(
        new Request(
          "http://localhost/time-entries?billId=00000000-0000-4000-8000-000000000101"
        )
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(2);
    });

    it("should return empty array for bill with no time entries", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries?billId=non-existent-bill")
      );

      expect(response.status).toBe(200);
      const body: unknown = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body).toHaveLength(0);
    });
  });

  describe("GET /time-entries without query params", () => {
    it("should return 400 when no query parameters provided", async () => {
      const response = await app.handle(
        new Request("http://localhost/time-entries")
      );

      expect(response.status).toBe(400);
      const body: unknown = await response.json();
      expect(body).toHaveProperty("error");
    });
  });
});
