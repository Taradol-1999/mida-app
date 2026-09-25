import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, type UserRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, is_active: true },
    select: { id: true, name: true, email: true, role: true, password_hash: true },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as UserRole });
  return NextResponse.json({ ok: true });
}
