import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";
import { projectLocationKey, projectLocationSchema } from "@/lib/project-location";
import { recordAdminActivity } from "@/lib/admin-activity";
import { resolveGoogleMapsCoordinates } from "@/lib/map-coordinates";

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const id = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!z.string().uuid().safeParse(id).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, id))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการโครงการนี้" }, { status: 403 });
  const [saved, project] = await Promise.all([
    prisma.siteContent.findUnique({ where: { content_key: projectLocationKey(id) } }),
    prisma.project.findUnique({ where: { id }, select: { settings: { select: { map_url: true } } } }),
  ]);
  if (!project) return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  return NextResponse.json({
    data: saved?.body ? JSON.parse(saved.body) : { mapUrl: project.settings?.map_url ?? "", imageId: null, places: [] },
  });
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = z
    .object({ projectId: z.string().uuid(), data: projectLocationSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const { projectId, data } = parsed.data;
  if (!canAccessProject(user, projectId))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการโครงการนี้" }, { status: 403 });
  if (!(await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } })))
    return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  if (
    data.imageId &&
    !(await prisma.mediaAsset.findFirst({
      where: {
        id: data.imageId,
        entity_type: "projects",
        entity_id: projectId,
        media_kind: "map-image",
        mime_type: { startsWith: "image/" },
      },
    }))
  )
    return NextResponse.json({ message: "รูปแผนที่ไม่ใช่ของโครงการนี้" }, { status: 400 });
  const coordinates = data.mapUrl ? await resolveGoogleMapsCoordinates(data.mapUrl).catch(() => null) : null;
  const body = JSON.stringify({
    ...data,
    latitude: coordinates?.latitude ?? null,
    longitude: coordinates?.longitude ?? null,
  });
  await prisma.siteContent.upsert({
    where: { content_key: projectLocationKey(projectId) },
    create: { content_key: projectLocationKey(projectId), title: "แผนที่และสถานที่ใกล้เคียง", body },
    update: { body },
  });
  await recordAdminActivity({
    request,
    user,
    action: "ADMIN_UPDATE",
    projectId,
    detail: "แก้ไขแผนที่และสถานที่ใกล้เคียง",
  });
  return NextResponse.json({ ok: true });
}
