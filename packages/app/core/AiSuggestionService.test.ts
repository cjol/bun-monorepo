import { describe, it, expect, beforeEach } from "bun:test";
import { testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { AiSuggestionService } from "./AiSuggestionService";
import { TimeEntryService } from "./TimeEntryService";
import { MatterService } from "./MatterService";

describe("AiSuggestionService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof AiSuggestionService>;
  let timeEntryService: ReturnType<typeof TimeEntryService>;
  let matterService: ReturnType<typeof MatterService>;
  let matterId: string;
  let timeEntryId: string;
  let messageId: string;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = AiSuggestionService({ repos });
    timeEntryService = TimeEntryService({ repos });
    matterService = MatterService({ repos });

    const matter = await matterService.createMatter({
      clientName: "Test Client",
      matterName: "Test Matter",
      description: null,
    });
    matterId = matter.id;

    const timeEntry = await timeEntryService.createTimeEntry({
      matterId,
      billId: null,
      date: new Date("2024-01-15"),
      hours: 2.5,
      description: "Client consultation",
    });
    timeEntryId = timeEntry.id;

    // Create a mock conversation and message
    const conversationId = crypto.randomUUID();
    await repos.conversation.create({
      id: conversationId,
      title: "Test Conversation",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    messageId = crypto.randomUUID();
    await repos.message.create({
      id: messageId,
      conversationId,
      role: "assistant",
      content: [{ type: "text", text: "Suggested change" }],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  });

  describe("createSuggestion", () => {
    it("should create a new AI suggestion", async () => {
      const result = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.0, description: "Updated description" },
      });

      expect(result).toEqual({
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
        ),
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.0, description: "Updated description" },
        status: "pending",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });

  describe("approveSuggestion", () => {
    it("should approve suggestion and apply changes to time entry", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.5 },
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const result = await service.approveSuggestion(suggestion.id);

      expect(result.status).toBe("approved");

      // Verify the time entry was updated
      const updatedTimeEntry = await timeEntryService.getTimeEntry(timeEntryId);
      expect(updatedTimeEntry?.hours).toBe(3.5);

      // Verify a change log was created
      const logs = await repos.timeEntryChangeLog.listByTimeEntry(timeEntryId);
      expect(logs.length).toBeGreaterThan(1);
    });

    it("should throw an error if suggestion does not exist", async () => {
      await expect(
        service.approveSuggestion("non-existent-id")
      ).rejects.toThrow();
    });

    it("should throw an error if suggestion is already approved", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.5 },
      });

      await service.approveSuggestion(suggestion.id);

      await expect(service.approveSuggestion(suggestion.id)).rejects.toThrow();
    });
  });

  describe("rejectSuggestion", () => {
    it("should reject a suggestion without applying changes", async () => {
      const suggestion = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.5 },
      });

      const result = await service.rejectSuggestion(suggestion.id);

      expect(result.status).toBe("rejected");

      // Verify the time entry was NOT updated
      const timeEntry = await timeEntryService.getTimeEntry(timeEntryId);
      expect(timeEntry?.hours).toBe(2.5);
    });

    it("should throw an error if suggestion does not exist", async () => {
      await expect(
        service.rejectSuggestion("non-existent-id")
      ).rejects.toThrow();
    });
  });

  describe("listByTimeEntry", () => {
    it("should list all suggestions for a time entry", async () => {
      const suggestion1 = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.0 },
      });

      const suggestion2 = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { description: "Different description" },
      });

      const result = await service.listByTimeEntry(timeEntryId);
      expect(result).toHaveLength(2);
      expect(result).toContainEqual(suggestion1);
      expect(result).toContainEqual(suggestion2);
    });

    it("should return empty array if no suggestions exist", async () => {
      const result = await service.listByTimeEntry(timeEntryId);
      expect(result).toEqual([]);
    });
  });

  describe("listByStatus", () => {
    it("should list all suggestions with a specific status", async () => {
      const pending1 = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.0 },
      });

      const pending2 = await service.createSuggestion({
        timeEntryId,
        messageId,
        suggestedChanges: { hours: 3.5 },
      });

      await service.approveSuggestion(pending1.id);

      const pendingResults = await service.listByStatus(matterId, "pending");
      expect(pendingResults).toHaveLength(1);
      expect(pendingResults[0]!.id).toBe(pending2.id);

      const approvedResults = await service.listByStatus(matterId, "approved");
      expect(approvedResults).toHaveLength(1);
      expect(approvedResults[0]!.id).toBe(pending1.id);
    });

    it("should return empty array if no suggestions have that status", async () => {
      const result = await service.listByStatus(matterId, "rejected");
      expect(result).toEqual([]);
    });
  });
});
