import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recordAdminActivity } from "@/lib/admin-activity";

const key = "floating_contact_widget";
const url = z.union([z.literal(""), z.string().trim().url().refine((value) => value.startsWith("https://"))]);
const schema = z.object({ line: url, messenger: url, phone: z.string().trim().max(30).regex(/^[0-9+()\s-]*$/), email: z.union([z.literal(""), z.string().trim().email().max(254)]) });
const defaults = { line: "", messenger: "", phone: "02 885 5558", email: "" };

export async function GET() {
  const user = await getSession();
  if (user?.role !== "SUPER_ADMIN") return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  const row = await prisma.siteContent.findUnique({ where: { content_key: key } });
  const email = await prisma.siteContent.findUnique({ where: { content_key: "floating_contact_email" } });
  return NextResponse.json({ line: row?.body ?? defaults.line, messenger: row?.body_en ?? defaults.messenger, phone: row?.title_en ?? defaults.phone, email: email?.body ?? "" });
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (user?.role !== "SUPER_ADMIN") return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณาตรวจสอบลิงก์ HTTPS เบอร์โทรศัพท์ และอีเมล" }, { status: 400 });
  const old = await prisma.siteContent.findUnique({ where: { content_key: key } });
  const oldEmail = await prisma.siteContent.findUnique({ where: { content_key: "floating_contact_email" } });
  const values = { title: "ช่องทางติดต่อ Floating Widget", title_en: parsed.data.phone, body: parsed.data.line, body_en: parsed.data.messenger };
  await prisma.$transaction([
    prisma.siteContent.upsert({ where: { content_key: key }, create: { content_key: key, ...values }, update: values }),
    prisma.siteContent.upsert({ where: { content_key: "floating_contact_email" }, create: { content_key: "floating_contact_email", title: "อีเมลช่องทางติดต่อ", body: parsed.data.email }, update: { body: parsed.data.email } }),
  ]);
  await recordAdminActivity({ request, user, action: "ADMIN_UPDATE", detail: "แก้ไขช่องทางติดต่อ Floating Widget", oldPayload: { line: old?.body ?? "", messenger: old?.body_en ?? "", phone: old?.title_en ?? defaults.phone, email: oldEmail?.body ?? "" }, newPayload: parsed.data });
  return NextResponse.json({ ok: true });
}
