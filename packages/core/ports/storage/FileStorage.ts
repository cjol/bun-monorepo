/**
 * File storage abstraction for documents.
 * Supports pluggable implementations (local filesystem, S3, etc.).
 */

export interface FileStorage {
  /**
   * Write content to a file path.
   * @param path - Relative path within the storage
   * @param content - File content as string or Buffer
   */
  write(path: string, content: Buffer | string): Promise<void>;

  /**
   * Read content from a file path.
   * @param path - Relative path within the storage
   * @returns File content as Buffer
   */
  read(path: string): Promise<Buffer>;

  /**
   * Check if a file exists at the given path.
   * @param path - Relative path within the storage
   */
  exists(path: string): Promise<boolean>;

  /**
   * Delete a file at the given path.
   * @param path - Relative path within the storage
   */
  delete(path: string): Promise<void>;
}
