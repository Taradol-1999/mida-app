import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
const idSchema = z.string().uuid();
const entityTypes = ["projects", "house-types", "promotions", "news", "site-content"] as const;
type EntityType = (typeof entityTypes)[number];
const mimeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "application/pdf": "pdf",
};
const uploadsDirectory = path.resolve(process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), "public", "uploads"));
const storedFilePath = (storageKey: unknown) => path.join(uploadsDirectory, path.basename(String(storageKey)));
function isEntityType(value: string): value is EntityType {
  return entityTypes.includes(value as EntityType);
}
function isKind(value: string) {
  return value === "cover" || value === "hero" || value === "brochure";
}
async function authorise() {
  const user = await getSession();
  return user && user.role !== "USER" ? user : null;
}
function valid(request: Request) {
  const url = new URL(request.url);
  const entityType = url.searchParams.get("entityType") ?? "";
  const entityId = url.searchParams.get("entityId") ?? "";
  return {
    entityType,
    entityId,
    mediaKind: url.searchParams.get("mediaKind") ?? "cover",
    list: url.searchParams.get("list") === "1",
  };
}

export async function GET(request: Request) {
  const { entityType, entityId, mediaKind, list } = valid(request);
  if (!isEntityType(entityType) || !idSchema.safeParse(entityId).success || !isKind(mediaKind))
    return NextResponse.json({ message: "คำขอรูปภาพไม่ถูกต้อง" }, { status: 400 });
  if (entityType !== "projects" && entityType !== "house-types" && !(await authorise()))
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const rows = await prisma.mediaAsset.findMany({
    where: { entity_type: entityType, entity_id: entityId, media_kind: mediaKind },
    select: { id: true, original_name: true, mime_type: true, storage_key: true },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  if (list)
    return NextResponse.json({
      rows: rows.map((row) => ({
        id: row.id,
        name: row.original_name,
        mimeType: row.mime_type,
        url: `/api/admin/media?entityType=${entityType}&entityId=${entityId}&mediaKind=${mediaKind}&mediaId=${row.id}`,
      })),
    });
  const mediaId = new URL(request.url).searchParams.get("mediaId");
  const media = mediaId ? rows.find((row) => row.id === mediaId) : rows[0];
  if (!media) return NextResponse.json({ message: "ยังไม่มีรูปภาพ" }, { status: 404 });
  try {
    const file = await readFile(storedFilePath(media.storage_key));
    return new Response(file, {
      headers: {
        "Content-Type": String(media.mime_type),
        "Cache-Control": "public, max-age=3600",
        ...(mediaKind === "brochure"
          ? { "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(String(media.original_name))}` }
          : {}),
      },
    });
  } catch {
    return NextResponse.json({ message: "ไม่พบไฟล์รูปภาพบนเครื่อง" }, { status: 404 });
  }
}

export async function POST(request: Request) {
  if (!(await authorise())) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const form = await request.formData();
  const entityType = String(form.get("entityType") ?? "");
  const entityId = String(form.get("entityId") ?? "");
  const mediaKind = String(form.get("mediaKind") ?? "cover");
  const file = form.get("file");
  if (
    !isEntityType(entityType) ||
    !idSchema.safeParse(entityId).success ||
    !isKind(mediaKind) ||
    !(file instanceof File)
  )
    return NextResponse.json({ message: "ข้อมูลอัปโหลดไม่ถูกต้อง" }, { status: 400 });
  const extension = mimeExtensions[file.type];
  const isVideo = file.type.startsWith("video/");
  const isBrochure = file.type === "application/pdf";
  const sizeLimit = isVideo ? 50 * 1024 * 1024 : isBrochure ? 20 * 1024 * 1024 : 5 * 1024 * 1024;
  if (!extension || !file.size || file.size > sizeLimit)
    return NextResponse.json(
      { message: "รองรับ JPG, PNG, WEBP ไม่เกิน 5 MB, PDF ไม่เกิน 20 MB และ MP4, WEBM ไม่เกิน 50 MB" },
      { status: 400 },
    );
  const entityExists =
    entityType === "projects"
      ? await prisma.project.findUnique({ where: { id: entityId }, select: { id: true } })
      : entityType === "house-types"
        ? await prisma.houseType.findUnique({ where: { id: entityId }, select: { id: true } })
        : entityType === "promotions"
          ? await prisma.promotion.findUnique({ where: { id: entityId }, select: { id: true } })
          : entityType === "news"
            ? await prisma.newsItem.findUnique({ where: { id: entityId }, select: { id: true } })
            : await prisma.siteContent.findUnique({ where: { id: entityId }, select: { id: true } });
  if (!entityExists) return NextResponse.json({ message: "ไม่พบข้อมูลที่ต้องการผูกรูปภาพ" }, { status: 404 });
  const storageKey = `uploads/${randomUUID()}.${extension}`;
  try {
    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(storedFilePath(storageKey), Buffer.from(await file.arrayBuffer()));
    if (mediaKind === "cover" || mediaKind === "brochure") {
      const oldRows = await prisma.mediaAsset.findMany({
        where: { entity_type: entityType, entity_id: entityId, media_kind: mediaKind },
        select: { storage_key: true },
      });
      await prisma.mediaAsset.deleteMany({
        where: { entity_type: entityType, entity_id: entityId, media_kind: mediaKind },
      });
      await Promise.all(oldRows.map((row) => unlink(storedFilePath(row.storage_key)).catch(() => undefined)));
    }
    const maximum = await prisma.mediaAsset.aggregate({
      where: { entity_type: entityType, entity_id: entityId, media_kind: mediaKind },
      _max: { sort_order: true },
    });
    await prisma.mediaAsset.create({
      data: {
        entity_type: entityType,
        entity_id: entityId,
        media_kind: mediaKind,
        original_name: file.name || `upload.${extension}`,
        mime_type: file.type,
        file_size: file.size,
        storage_key: storageKey,
        sort_order: (maximum._max.sort_order ?? -1) + 1,
      },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "อัปโหลดรูปภาพไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await authorise())) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const { entityType, entityId, mediaKind } = valid(request);
  const mediaId = new URL(request.url).searchParams.get("mediaId") ?? "";
  if (
    !isEntityType(entityType) ||
    !idSchema.safeParse(entityId).success ||
    !idSchema.safeParse(mediaId).success ||
    mediaKind !== "hero"
  )
    return NextResponse.json({ message: "คำขอลบรูปภาพไม่ถูกต้อง" }, { status: 400 });
  const media = await prisma.mediaAsset.findFirst({
    where: { id: mediaId, entity_type: entityType, entity_id: entityId, media_kind: "hero" },
    select: { storage_key: true },
  });
  if (!media) return NextResponse.json({ message: "ไม่พบรูปภาพ" }, { status: 404 });
  await prisma.mediaAsset.delete({ where: { id: mediaId } });
  await unlink(storedFilePath(media.storage_key)).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
