import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
const idSchema = z.string().uuid();
const entities = {
  projects: "projects",
  "house-types": "house_types",
  promotions: "promotions",
  news: "news_items",
  "site-content": "site_content",
} as const;
type EntityType = keyof typeof entities;
const mimeExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");
function isEntityType(value: string): value is EntityType {
  return value in entities;
}
function isKind(value: string) {
  return value === "cover" || value === "hero";
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
  if (entityType !== "projects" && !(await authorise()))
    return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const [rows] = await db().execute<RowDataPacket[]>(
    "SELECT id, original_name, mime_type, storage_key FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind=? ORDER BY sort_order, created_at",
    [entityType, entityId, mediaKind],
  );
  if (list)
    return NextResponse.json({
      rows: rows.map((row) => ({
        id: row.id,
        name: row.original_name,
        url: `/api/admin/media?entityType=${entityType}&entityId=${entityId}&mediaKind=${mediaKind}&mediaId=${row.id}`,
      })),
    });
  const mediaId = new URL(request.url).searchParams.get("mediaId");
  const media = mediaId ? rows.find((row) => row.id === mediaId) : rows[0];
  if (!media) return NextResponse.json({ message: "ยังไม่มีรูปภาพ" }, { status: 404 });
  try {
    const file = await readFile(path.join(process.cwd(), "public", String(media.storage_key)));
    return new Response(file, {
      headers: { "Content-Type": String(media.mime_type), "Cache-Control": "public, max-age=3600" },
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
  if (!extension || !file.size || file.size > 5 * 1024 * 1024)
    return NextResponse.json({ message: "รองรับ JPG, PNG, WEBP ขนาดไม่เกิน 5 MB" }, { status: 400 });
  const [entityRows] = await db().execute<RowDataPacket[]>(
    `SELECT id FROM ${entities[entityType]} WHERE id=? LIMIT 1`,
    [entityId],
  );
  if (!entityRows.length) return NextResponse.json({ message: "ไม่พบข้อมูลที่ต้องการผูกรูปภาพ" }, { status: 404 });
  const storageKey = `uploads/${randomUUID()}.${extension}`;
  try {
    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(path.join(process.cwd(), "public", storageKey), Buffer.from(await file.arrayBuffer()));
    if (mediaKind === "cover") {
      const [oldRows] = await db().execute<RowDataPacket[]>(
        "SELECT storage_key FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind='cover' LIMIT 1",
        [entityType, entityId],
      );
      await db().execute("DELETE FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind='cover'", [
        entityType,
        entityId,
      ]);
      if (oldRows[0]?.storage_key)
        await unlink(path.join(process.cwd(), "public", String(oldRows[0].storage_key))).catch(() => undefined);
    }
    await db().execute(
      "INSERT INTO media_assets (id, entity_type, entity_id, media_kind, original_name, mime_type, file_size, storage_key, sort_order) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), -1) + 1 FROM (SELECT sort_order FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind=?) AS ordered_media))",
      [
        entityType,
        entityId,
        mediaKind,
        file.name || `upload.${extension}`,
        file.type,
        file.size,
        storageKey,
        entityType,
        entityId,
        mediaKind,
      ],
    );
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
  const [rows] = await db().execute<RowDataPacket[]>(
    "SELECT storage_key FROM media_assets WHERE id=? AND entity_type=? AND entity_id=? AND media_kind='hero'",
    [mediaId, entityType, entityId],
  );
  if (!rows[0]) return NextResponse.json({ message: "ไม่พบรูปภาพ" }, { status: 404 });
  await db().execute("DELETE FROM media_assets WHERE id=?", [mediaId]);
  await unlink(path.join(process.cwd(), "public", String(rows[0].storage_key))).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
