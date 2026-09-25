import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getSession } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { resolveGoogleMapsCoordinates } from "@/lib/map-coordinates";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().uuid();
const fields = [
  "hero_title_th",
  "hero_title_en",
  "hero_subtitle_th",
  "hero_subtitle_en",
  "phone",
  "email",
  "map_url",
  "virtual_tour_url",
  "nearby_places_th",
  "nearby_places_en",
  "care_warranty",
  "care_maintenance",
  "care_common_area",
] as const;

async function authorise() {
  const user = await getSession();
  return user;
}
function nullable(body: Record<string, unknown>, field: string) {
  const value = String(body[field] ?? "").trim();
  return value || null;
}
function coordinate(body: Record<string, unknown>, field: "latitude" | "longitude") {
  const raw = String(body[field] ?? "").trim();
  if (!raw) return null;
  const value = Number(raw);
  const limit = field === "latitude" ? 90 : 180;
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : undefined;
}

export async function GET(request: Request) {
  const user = await authorise();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!idSchema.safeParse(projectId).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, projectId))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการโครงการนี้" }, { status: 403 });
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { latitude: true, longitude: true, settings: true },
  });
  if (!project) return NextResponse.json({ settings: null });
  return NextResponse.json({
    settings: {
      ...(project.settings ?? { project_id: projectId }),
      latitude: project.latitude === null ? null : Number(project.latitude),
      longitude: project.longitude === null ? null : Number(project.longitude),
    },
  });
}

export async function PUT(request: Request) {
  const user = await authorise();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const projectId = String(body.project_id ?? "");
  if (!idSchema.safeParse(projectId).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  if (!canAccessProject(user, projectId))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการโครงการนี้" }, { status: 403 });
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!project) return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  const submittedFields = fields.filter((field) => Object.prototype.hasOwnProperty.call(body, field));
  const hasCoordinates =
    Object.prototype.hasOwnProperty.call(body, "latitude") || Object.prototype.hasOwnProperty.call(body, "longitude");
  if (!submittedFields.length && !hasCoordinates)
    return NextResponse.json({ message: "ไม่พบข้อมูลสำหรับบันทึก" }, { status: 400 });

  const mapCoordinates = body.map_url
    ? await resolveGoogleMapsCoordinates(String(body.map_url)).catch(() => null)
    : null;
  const latitude = mapCoordinates?.latitude ?? coordinate(body, "latitude");
  const longitude = mapCoordinates?.longitude ?? coordinate(body, "longitude");
  if (latitude === undefined || longitude === undefined)
    return NextResponse.json({ message: "พิกัดแผนที่ไม่ถูกต้อง" }, { status: 400 });

  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [];
    if (submittedFields.length) {
      const settingsData = Object.fromEntries(
        submittedFields.map((field) => [field, nullable(body, field)]),
      ) as Prisma.ProjectSettingUncheckedUpdateInput;
      operations.push(
        prisma.projectSetting.upsert({
          where: { project_id: projectId },
          create: { project_id: projectId, ...settingsData } as Prisma.ProjectSettingUncheckedCreateInput,
          update: settingsData,
        }),
      );
    }
    if (hasCoordinates || mapCoordinates) {
      operations.push(
        prisma.project.update({
          where: { id: projectId },
          data: { latitude: latitude ?? null, longitude: longitude ?? null },
        }),
      );
    }
    await prisma.$transaction(operations);
  } catch {
    return NextResponse.json({ message: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, coordinates: mapCoordinates });
}
