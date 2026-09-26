import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { midaPrisma?: PrismaClient };

function createPrismaClient() {
  const host = process.env.DB_HOST ?? "127.0.0.1";
  const localHost = host === "127.0.0.1" || host === "localhost" || host === "::1";
  const adapter = new PrismaMariaDb({
    host,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "mida_app",
    connectionLimit: 10,
    // MySQL 8 accounts using caching_sha2_password need the server RSA key.
    // Local databases are trusted; remote hosts must opt in explicitly.
    allowPublicKeyRetrieval: localHost || process.env.DB_ALLOW_PUBLIC_KEY_RETRIEVAL === "true",
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.midaPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.midaPrisma = prisma;
