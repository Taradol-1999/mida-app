import bcrypt from "bcryptjs";
import { prisma } from "./prisma.ts";

const [name, email, password] = process.argv.slice(2);
if (!name || !email || !password) {
  console.error("Usage: node scripts/create-admin.mjs <name> <email> <password>");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);
await prisma.user.upsert({
  where: { email },
  create: { name, email, password_hash: hash, role: "SUPER_ADMIN", is_active: true },
  update: { name, password_hash: hash, role: "SUPER_ADMIN", is_active: true },
});
await prisma.$disconnect();
console.log(`Super Admin ${email} is ready.`);
