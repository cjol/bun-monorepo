import { defineConfig } from "evalite/config";
import { createSqliteStorage } from "evalite/sqlite-storage";

export default defineConfig({
  // Enable caching by default for faster development
  cache: true,
  testTimeout: 60_000,
  storage: () => createSqliteStorage("./evalite.db"),
});
