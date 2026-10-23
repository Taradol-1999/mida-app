import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { projectShowcaseSchema, showcaseKey } from "@/lib/project-showcase";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, id)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  const row = await prisma.siteContent.findUnique({ where: { content_key: showcaseKey(id) } });
  return NextResponse.json({ data: row?.body ? JSON.parse(row.body) : null });
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = z
    .object({ projectId: z.string().uuid(), data: projectShowcaseSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "กรอกหัวข้อหลักและชื่อของแต่ละรูปให้ครบ" }, { status: 400 });
  const { projectId, data } = parsed.data;
  if (!canAccessProject(user, projectId)) return NextResponse.json({ message: "ไม่มีสิทธิ์" }, { status: 403 });
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })))
    return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  const ids = [...new Set(data.items.map((item) => item.mediaId))];
  const count = await prisma.mediaAsset.count({
    where: {
      id: { in: ids },
      entity_type: "projects",
      entity_id: projectId,
      media_kind: "nearby",
      mime_type: { startsWith: "image/" },
    },
  });
  if (count !== ids.length || ids.length !== data.items.length)
    return NextResponse.json({ message: "รูปภาพไม่ถูกต้องหรือไม่ใช่ของโครงการนี้" }, { status: 400 });
  await prisma.siteContent.upsert({
    where: { content_key: showcaseKey(projectId) },
    create: { content_key: showcaseKey(projectId), title: data.title, body: JSON.stringify(data) },
    update: { title: data.title, body: JSON.stringify(data) },
  });
  return NextResponse.json({ ok: true });
}
