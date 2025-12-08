import type { FileStorage } from "@ai-starter/core";

/**
 * In-memory mock implementation of FileStorage for testing and eval contexts.
 * Stores files in a Map in memory instead of on disk.
 */
export const MockFileStorage = (): FileStorage => {
  const files = new Map<string, Buffer>();

  const fullPath = (path: string) => path;

  return {
    async write(path: string, content: Buffer | string): Promise<void> {
      const buffer =
        typeof content === "string" ? Buffer.from(content) : content;
      files.set(fullPath(path), buffer);
    },

    async read(path: string): Promise<Buffer> {
      const content = files.get(fullPath(path));
      if (!content) {
        throw new Error(`File not found: ${path}`);
      }
      return content;
    },

    async exists(path: string): Promise<boolean> {
      return files.has(fullPath(path));
    },

    async delete(path: string): Promise<void> {
      files.delete(fullPath(path));
    },
  };
};
