import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma CLI does not load Next.js' .env.local automatically.
// Read it first so db push, generate, and Studio use the same local MySQL connection as the app.
config({ path: ".env.local" });
config();

function databaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const user = encodeURIComponent(process.env.DB_USER ?? "root");
  const password = encodeURIComponent(process.env.DB_PASSWORD ?? "");
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const port = process.env.DB_PORT ?? "3306";
  const database = process.env.DB_NAME ?? "mida_app";
  return `mysql://${user}:${password}@${host}:${port}/${database}`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: databaseUrl() },
});
