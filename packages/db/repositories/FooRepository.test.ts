import { describe, it, expect, beforeEach } from "bun:test";
import { fooSchema } from "@ai-starter/core";
import { DrizzleFooRepository } from "./FooRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";
import { doSeedFoos } from "../test-utils";

describe("DrizzleFooRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleFooRepository>;

  beforeEach(async () => {
    db = await testDB();
    doSeedFoos(db);
    repository = DrizzleFooRepository({ db });
  });

  describe("get", () => {
    it("should return null when foo does not exist", async () => {
      const result = await repository.get("non-existent-id");
      expect(result).toBeNull();
    });

    it("should return foo when it exists", async () => {
      await db.insert(fooSchema).values({
        id: "test-id",
        name: "Test Foo",
        createdAt: new Date(),
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
    });
  });

  describe("create", () => {
    it("should create a new foo", async () => {
      const now = new Date();
      now.setMilliseconds(0); // SQLite precision fix
      const foo = await repository.create({
        id: "new-id",
        name: "Test Foo",
        createdAt: now,
      });

      const result = await repository.get(foo.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(foo.id);
      expect(foo.id).toBe("new-id");
      expect(foo.createdAt).toEqual(now);
    });

    it("should assign an ID and created date for a new foo", async () => {
      const x = await repository.create({ name: "Test Foo" });

      const result = await repository.get(x.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBeDefined();
      expect(result?.createdAt).toBeDefined();

      await repository.patch(x.id, "Updated Name");

      const updatedResult = await repository.get(x.id);
      expect(updatedResult?.name).toBe("Updated Name");
    });
  });
});
