import { unlink } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { recordAdminActivity } from "@/lib/admin-activity";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const idSchema = z.string().uuid();
const payloadSchema = z.object({
  name_th: z.string().trim().min(1, "กรุณาระบุชื่อ (TH)").max(255),
  name_en: z.string().trim().max(255).optional().nullable(),
  description_th: z.string().trim().optional().nullable(),
  description_en: z.string().trim().optional().nullable(),
  website_url: z
    .union([z.literal(""), z.string().trim().url("ลิงก์เว็บไซต์ไม่ถูกต้อง")])
    .optional()
    .nullable(),
  sort_order: z.coerce.number().int().min(0).max(9999).default(0),
  is_active: z.boolean().default(true),
});

const uploadsDirectory = path.resolve(process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), "public", "uploads"));
const jsonPayload = (value: unknown) => JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

async function superAdmin() {
  const user = await getSession();
  return user?.role === "SUPER_ADMIN" ? user : null;
}

export async function GET() {
  const user = await superAdmin();
  if (!user) return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  try {
    const rows = await prisma.midaLivingItem.findMany({
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    const media = await prisma.mediaAsset.findMany({
      where: { entity_type: "mida-living", entity_id: { in: rows.map((row) => row.id) }, media_kind: "portrait" },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    const firstMedia = new Map<string, (typeof media)[number]>();
    for (const item of media) if (!firstMedia.has(item.entity_id)) firstMedia.set(item.entity_id, item);
    return NextResponse.json({
      rows: rows.map((row) => {
        const image = firstMedia.get(row.id);
        return {
          ...row,
          imageId: image?.id ?? null,
          imageUrl: image
            ? `/api/admin/media?entityType=mida-living&entityId=${row.id}&mediaKind=portrait&mediaId=${image.id}`
            : null,
        };
      }),
    });
  } catch (error) {
    console.error("Unable to load MIDA Living items", error);
    return NextResponse.json({ message: "โหลดข้อมูลไม่สำเร็จ กรุณารีสตาร์ตระบบแล้วลองใหม่" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await superAdmin();
  if (!user) return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  const parsed = payloadSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const row = await prisma.midaLivingItem
    .create({
      data: {
        ...parsed.data,
        name_en: parsed.data.name_en || null,
        description_th: parsed.data.description_th || null,
        description_en: parsed.data.description_en || null,
        website_url: parsed.data.website_url || null,
      },
    })
    .catch((error) => {
      console.error("Unable to create MIDA Living item", error);
      return null;
    });
  if (!row) return NextResponse.json({ message: "เพิ่มข้อมูลไม่สำเร็จ กรุณารีสตาร์ตระบบแล้วลองใหม่" }, { status: 500 });
  await recordAdminActivity({
    request,
    user,
    action: "ADMIN_CREATE",
    detail: `เพิ่มรายการเริ่มที่เรา เริ่มที่ไมด้า: ${row.name_th}`,
    newPayload: jsonPayload(row),
  });
  return NextResponse.json({ row }, { status: 201 });
}

export async function PUT(request: Request) {
  const user = await superAdmin();
  if (!user) return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  const body = (await request.json()) as Record<string, unknown>;
  const id = String(body.id ?? "");
  if (!idSchema.safeParse(id).success) return NextResponse.json({ message: "รหัสรายการไม่ถูกต้อง" }, { status: 400 });
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" }, { status: 400 });
  const oldRow = await prisma.midaLivingItem.findUnique({ where: { id } });
  if (!oldRow) return NextResponse.json({ message: "ไม่พบรายการ" }, { status: 404 });
  const row = await prisma.midaLivingItem.update({
    where: { id },
    data: {
      ...parsed.data,
      name_en: parsed.data.name_en || null,
      description_th: parsed.data.description_th || null,
      description_en: parsed.data.description_en || null,
      website_url: parsed.data.website_url || null,
    },
  });
  await recordAdminActivity({
    request,
    user,
    action: "ADMIN_UPDATE",
    detail: `แก้ไขรายการเริ่มที่เรา เริ่มที่ไมด้า: ${row.name_th}`,
    oldPayload: jsonPayload(oldRow),
    newPayload: jsonPayload(row),
  });
  return NextResponse.json({ row });
}

export async function DELETE(request: Request) {
  const user = await superAdmin();
  if (!user) return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการข้อมูลส่วนกลาง" }, { status: 403 });
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!idSchema.safeParse(id).success) return NextResponse.json({ message: "รหัสรายการไม่ถูกต้อง" }, { status: 400 });
  const row = await prisma.midaLivingItem.findUnique({ where: { id } });
  if (!row) return NextResponse.json({ message: "ไม่พบรายการ" }, { status: 404 });
  const media = await prisma.mediaAsset.findMany({
    where: { entity_type: "mida-living", entity_id: id },
    select: { id: true, storage_key: true },
  });
  await prisma.$transaction([
    prisma.mediaAsset.deleteMany({ where: { entity_type: "mida-living", entity_id: id } }),
    prisma.midaLivingItem.delete({ where: { id } }),
  ]);
  await Promise.all(
    media.map((item) => unlink(path.join(uploadsDirectory, path.basename(item.storage_key))).catch(() => undefined)),
  );
  await recordAdminActivity({
    request,
    user,
    action: "ADMIN_DELETE",
    detail: `ลบรายการเริ่มที่เรา เริ่มที่ไมด้า: ${row.name_th}`,
    oldPayload: jsonPayload(row),
  });
  return NextResponse.json({ ok: true });
}
