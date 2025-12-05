import { promises as fs } from "node:fs";
import { join, dirname } from "node:path";
import type { FileStorage } from "@ai-starter/core";

export interface LocalFileStorageConfig {
  /** Base directory for file storage */
  basePath: string;
}

/**
 * Local filesystem implementation of FileStorage.
 * Stores files in a hierarchical structure under the base path.
 */
export const LocalFileStorage = (
  config: LocalFileStorageConfig
): FileStorage => {
  const { basePath } = config;

  const fullPath = (path: string) => join(basePath, path);

  return {
    async write(path: string, content: Buffer | string): Promise<void> {
      const targetPath = fullPath(path);
      const targetDir = dirname(targetPath);

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Write file
      if (typeof content === "string") {
        await fs.writeFile(targetPath, content, "utf8");
      } else {
        await fs.writeFile(targetPath, content);
      }
    },

    async read(path: string): Promise<Buffer> {
      const targetPath = fullPath(path);
      return await fs.readFile(targetPath);
    },

    async exists(path: string): Promise<boolean> {
      const targetPath = fullPath(path);
      try {
        await fs.access(targetPath);
        return true;
      } catch {
        return false;
      }
    },

    async delete(path: string): Promise<void> {
      const targetPath = fullPath(path);
      await fs.unlink(targetPath);
    },
  };
};
