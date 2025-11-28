import { createClient } from "@ai-starter/api/client";

export const api = createClient(
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
);
