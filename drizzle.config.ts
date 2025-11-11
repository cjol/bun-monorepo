import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./packages/core/schema",
  dialect: "sqlite",
  dbCredentials: {
    url: "sqlite.db",
  },
});
