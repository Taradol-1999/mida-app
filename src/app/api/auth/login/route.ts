import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, type UserRole } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง" }, { status: 400 });

  const [rows] = await db().execute<import("mysql2").RowDataPacket[]>(
    "SELECT id, name, email, role, password_hash FROM users WHERE email = ? AND is_active = 1 LIMIT 1",
    [parsed.data.email],
  );
  const user = rows[0];
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as UserRole });
  return NextResponse.json({ ok: true });
}
