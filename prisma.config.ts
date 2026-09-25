import { defineConfig } from "prisma/config";
import { config as loadEnv } from "dotenv";

// prisma.config.ts opts out of Prisma's built-in dotenv loading, so load it
// ourselves. `next dev`/`next build` already read .env.local on their own;
// this only matters for the bare `prisma` CLI (generate/migrate/seed).
loadEnv({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
});
