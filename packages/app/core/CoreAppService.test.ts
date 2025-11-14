import { describe, it, expect, beforeEach } from "bun:test";
import { mockFoos, testDB } from "@ai-starter/db/test-utils";
import { getRepos, type DB } from "@ai-starter/db";
import { CoreAppService } from "./CoreAppService";

describe("CoreAppService", () => {
  let db: DB;
  let repos: ReturnType<typeof getRepos>;
  let service: ReturnType<typeof CoreAppService>;

  beforeEach(async () => {
    db = await testDB();
    repos = await getRepos(db);
    service = CoreAppService({ repos: repos });
  });

  describe("getFoo", () => {
    it("should call the repository's get method with the correct id", async () => {
      const result = await service.getFoo("foo-1");
      expect(result).toEqual(mockFoos[0]);
    });

    it("should return null if the repository returns null", async () => {
      const result = await service.getFoo("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("patchFoo", () => {
    it("should call the repository's patch method and return the result", async () => {
      const result = await service.patchFoo("foo-1", "Updated Name");
      expect(result).toEqual({
        id: "foo-1",
        name: "Updated Name",
        createdAt: mockFoos[0].createdAt,
        updatedAt: expect.any(Date),
      });
      expect(result.updatedAt.getTime()).toBeGreaterThan(
        mockFoos[0].updatedAt.getTime()
      );
    });

    it("should throw an error if business logic fails (e.g., name too short)", async () => {
      await expect(service.patchFoo("foo-1", "a")).rejects.toThrow(
        /Too small: expected string to have >=3 characters/
      );
    });
    describe("createFoo", () => {
      it("should validate and create a new Foo with generated id and timestamps", async () => {
        const result = await service.createFoo("New Foo Item");

        expect(result).toEqual({
          id: expect.stringMatching(
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
          ),
          name: "New Foo Item",
          createdAt: expect.any(Date),
          updatedAt: expect.any(Date),
        });

        // Verify it was actually persisted
        const fetched = await service.getFoo(result.id);
        expect(fetched).toEqual(result);
      });

      it("should throw an error if name is too short", async () => {
        await expect(service.createFoo("ab")).rejects.toThrow(
          /Too small: expected string to have >=3 characters/
        );
      });

      it("should throw an error if name is empty", async () => {
        await expect(service.createFoo("")).rejects.toThrow();
      });
    });
  });
});
