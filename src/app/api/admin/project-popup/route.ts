import { NextResponse } from "next/server";
import { z } from "zod";
import { recordAdminActivity } from "@/lib/admin-activity";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { projectPopupKey, projectPopupSchema, readProjectPopup } from "@/lib/project-popup";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!z.string().uuid().safeParse(projectId).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, projectId)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  const row = await prisma.siteContent.findUnique({ where: { content_key: projectPopupKey(projectId) } });
  try {
    return NextResponse.json({ data: readProjectPopup(JSON.parse(row?.body || "null")) });
  } catch {
    return NextResponse.json({ data: { items: [] } });
  }
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = z
    .object({ projectId: z.string().uuid(), data: projectPopupSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { projectId, data } = parsed.data;
  if (!canAccessProject(user, projectId)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })))
    return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  const imageIds = [...new Set(data.items.map((item) => item.imageId))];
  if (imageIds.length !== data.items.length)
    return NextResponse.json({ message: "รูป Popup แต่ละรายการต้องไม่ซ้ำกัน" }, { status: 400 });
  const imageCount = imageIds.length
    ? await prisma.mediaAsset.count({
        where: {
          id: { in: imageIds },
          entity_type: "projects",
          entity_id: projectId,
          media_kind: "popup",
          mime_type: { in: ["image/jpeg", "image/png", "image/webp"] },
        },
      })
    : 0;
  if (imageCount !== imageIds.length)
    return NextResponse.json({ message: "พบรูป Popup ที่ไม่ถูกต้องหรือไม่ใช่ของโครงการนี้" }, { status: 400 });
  await prisma.siteContent.upsert({
    where: { content_key: projectPopupKey(projectId) },
    create: { content_key: projectPopupKey(projectId), title: "Popup โฆษณา", body: JSON.stringify(data) },
    update: { body: JSON.stringify(data) },
  });
  await recordAdminActivity({
    request,
    user,
    action: "ADMIN_UPDATE",
    projectId,
    detail: `แก้ไข Popup โฆษณา ${data.items.length} รายการ`,
  });
  return NextResponse.json({ ok: true });
}

