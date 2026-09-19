import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <name> <email> <password>");
  process.exit(1);
}

const connection = await mysql.createConnection({
  host: process.env.DB_HOST ?? "127.0.0.1",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME ?? "mida_app",
});

const hash = await bcrypt.hash(password, 12);
await connection.execute(
  "INSERT INTO users (id, name, email, password_hash, role) VALUES (UUID(), ?, ?, ?, 'SUPER_ADMIN') ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash), role = 'SUPER_ADMIN', is_active = TRUE",
  [name, email, hash],
);
await connection.end();
console.log(`Super Admin ${email} is ready.`);
