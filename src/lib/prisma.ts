import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & { midaPrisma?: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaMariaDb({
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASSWORD ?? "",
    database: process.env.DB_NAME ?? "mida_app",
    connectionLimit: 10,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.midaPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.midaPrisma = prisma;
