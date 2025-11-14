import fs from "fs";
import os from "os";
import path from "path";
import { getDB, migrateDB } from "@ai-starter/db";

export const setupDB = async (prefix: string) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  const dbPath = path.join(tmpDir, "test.db");
  const db = getDB(`file:${dbPath}`);
  await migrateDB(db);
  return { db, tmpDir, dbPath };
};
