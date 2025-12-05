import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LocalFileStorage } from "./LocalFileStorage";
import type { FileStorage } from "@ai-starter/core";

describe("LocalFileStorage", () => {
  let storage: FileStorage;
  let tempDir: string;

  beforeEach(async () => {
    tempDir = join(tmpdir(), `local-storage-test-${Date.now()}`);
    storage = LocalFileStorage({ basePath: tempDir });
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("write", () => {
    it("should write string content to file", async () => {
      await storage.write("test.txt", "Hello, World!");

      const content = await fs.readFile(join(tempDir, "test.txt"), "utf8");
      expect(content).toBe("Hello, World!");
    });

    it("should write buffer content to file", async () => {
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello"
      await storage.write("test.bin", buffer);

      const content = await fs.readFile(join(tempDir, "test.bin"));
      expect(content).toEqual(buffer);
    });

    it("should create nested directories if they don't exist", async () => {
      await storage.write("nested/deep/test.txt", "Nested content");

      const content = await fs.readFile(
        join(tempDir, "nested/deep/test.txt"),
        "utf8"
      );
      expect(content).toBe("Nested content");
    });
  });

  describe("read", () => {
    it("should read file content as buffer", async () => {
      const testContent = "Test content";
      await storage.write("test.txt", testContent);

      const content = await storage.read("test.txt");
      expect(content.toString("utf8")).toBe(testContent);
    });
  });

  describe("exists", () => {
    it("should return true for existing file", async () => {
      await storage.write("exists.txt", "exists");

      const exists = await storage.exists("exists.txt");
      expect(exists).toBe(true);
    });

    it("should return false for non-existing file", async () => {
      const exists = await storage.exists("nonexistent.txt");
      expect(exists).toBe(false);
    });
  });

  describe("delete", () => {
    it("should delete existing file", async () => {
      await storage.write("delete.txt", "to be deleted");

      await storage.delete("delete.txt");

      const exists = await storage.exists("delete.txt");
      expect(exists).toBe(false);
    });
  });

  describe("integration", () => {
    it("should handle complete write-read-delete cycle", async () => {
      const originalContent = "Integration test content";

      // Write
      await storage.write("integration.txt", originalContent);

      // Verify exists
      expect(await storage.exists("integration.txt")).toBe(true);

      // Read
      const readContent = await storage.read("integration.txt");
      expect(readContent.toString("utf8")).toBe(originalContent);

      // Delete
      await storage.delete("integration.txt");

      // Verify deleted
      expect(await storage.exists("integration.txt")).toBe(false);
    });
  });
});
