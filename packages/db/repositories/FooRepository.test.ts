import { describe, it, expect, beforeEach } from "bun:test";
import { fooSchema } from "@ai-starter/core";
import { DrizzleFooRepository } from "./FooRepository";
import type { DB } from "../db";
import { testDB } from "../test-utils/db";

describe("DrizzleFooRepository", () => {
  let db: DB;
  let repository: ReturnType<typeof DrizzleFooRepository>;

  beforeEach(async () => {
    db = await testDB({ seed: false });
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
      });

      const result = await repository.get("test-id");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("test-id");
    });
  });

  describe("create", () => {
    it("should create a new foo", async () => {
      const foo = await repository.create({
        name: "Test Foo",
      });

      const result = await repository.get(foo.id);

      expect(result).toMatchObject({
        name: "Test Foo",
        id: expect.any(String),
        createdAt: expect.any(Date),
      });
    });
  });
});
