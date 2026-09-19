import mysql, { type Pool } from "mysql2/promise";

const globalForDatabase = globalThis as typeof globalThis & { midaMysqlPool?: Pool };

export function db() {
  if (!globalForDatabase.midaMysqlPool) {
    globalForDatabase.midaMysqlPool = mysql.createPool({
      host: process.env.DB_HOST ?? "127.0.0.1",
      port: Number(process.env.DB_PORT ?? 3306),
      user: process.env.DB_USER ?? "root",
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME ?? "mida_app",
      waitForConnections: true,
      connectionLimit: 10,
    });
  }
  return globalForDatabase.midaMysqlPool;
}
