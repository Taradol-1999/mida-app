import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { projectContactKey, projectContactSchema } from "@/lib/project-contact";
import { recordAdminActivity } from "@/lib/admin-activity";
import { contactOptionsKey, readContactOptions, mergeContactOptions } from "@/lib/contact-widget-options";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, id)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  const [project, contact, options] = await Promise.all([
    prisma.project.findUnique({ where: { id }, select: { settings: true } }),
    prisma.siteContent.findUnique({ where: { content_key: projectContactKey(id) } }),
    prisma.siteContent.findUnique({ where: { content_key: contactOptionsKey(id) } }),
  ]);
  if (!project) return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  return NextResponse.json({
    ...readContactOptions(options?.body),
    line: project.settings?.line_url ?? "",
    messenger: contact?.body ?? "",
    tiktok: contact?.body_en ?? "",
    phone: project.settings?.phone ?? "",
    email: project.settings?.email ?? "",
  });
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = z
    .object({ projectId: z.string().uuid(), contact: projectContactSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: "กรุณาตรวจสอบลิงก์ HTTPS เบอร์โทร และอีเมล" }, { status: 400 });
  const { projectId, contact } = parsed.data;
  if (!canAccessProject(user, projectId)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })))
    return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  const settings = { phone: contact.phone || null, email: contact.email || null, line_url: contact.line || null };
  const oldOptions = await prisma.siteContent.findUnique({ where: { content_key: contactOptionsKey(projectId) } });
  const body = JSON.stringify(mergeContactOptions(oldOptions?.body, contact));
  await prisma.$transaction([
    prisma.siteContent.upsert({
      where: { content_key: contactOptionsKey(projectId) },
      create: { content_key: contactOptionsKey(projectId), title: "การแสดงปุ่มติดต่อโครงการ", body },
      update: { body },
    }),
    prisma.projectSetting.upsert({
      where: { project_id: projectId },
      create: { project_id: projectId, ...settings },
      update: settings,
    }),
    prisma.siteContent.upsert({
      where: { content_key: projectContactKey(projectId) },
      create: {
        content_key: projectContactKey(projectId),
        title: "ช่องทางติดต่อโครงการ",
        body: contact.messenger,
        body_en: contact.tiktok ?? "",
      },
      update: { body: contact.messenger, ...(contact.tiktok !== undefined ? { body_en: contact.tiktok } : {}) },
    }),
  ]);
  await recordAdminActivity({ request, user, action: "ADMIN_UPDATE", projectId, detail: "แก้ไขช่องทางติดต่อโครงการ" });
  return NextResponse.json({ ok: true });
}
