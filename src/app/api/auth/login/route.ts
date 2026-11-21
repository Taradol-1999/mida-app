import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, type UserRole } from "@/lib/auth";
import { getClientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { clearRateLimit, takeRateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });

export async function POST(request: Request) {
  const rateLimitKey = `login:${getClientIp(request) ?? "unknown"}`;
  const rateLimit = takeRateLimit(rateLimitKey, 10, 15 * 60 * 1_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { message: "เข้าสู่ระบบไม่สำเร็จหลายครั้ง กรุณารอสักครู่แล้วลองใหม่" },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
    );
  }
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณากรอกอีเมลและรหัสผ่านให้ถูกต้อง" }, { status: 400 });

  const user = await prisma.user.findFirst({
    where: { email: parsed.data.email, is_active: true },
    select: { id: true, name: true, email: true, role: true, password_hash: true },
  });
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) {
    return NextResponse.json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }, { status: 401 });
  }
  clearRateLimit(rateLimitKey);
  await createSession({ id: user.id, name: user.name, email: user.email, role: user.role as UserRole });
  await prisma.activityLog.create({
    data: {
      area: "ADMIN",
      action: "LOGIN",
      path: "/login",
      user_id: user.id,
      ip_address: getClientIp(request),
      detail: "เข้าสู่ระบบหลังบ้าน",
    },
  });
  return NextResponse.json({ ok: true });
}
