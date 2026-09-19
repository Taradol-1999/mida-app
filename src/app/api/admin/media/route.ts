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
const entities = { projects: "projects", "house-types": "house_types", promotions: "promotions", news: "news_items" } as const;
type EntityType = keyof typeof entities;
const mimeExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const uploadsDirectory = path.join(process.cwd(), "public", "uploads");

function isEntityType(value: string): value is EntityType { return value in entities; }
async function authorise() { const user = await getSession(); return user && user.role !== "USER" ? user : null; }

export async function GET(request: Request) {
  const url = new URL(request.url); const entityType = url.searchParams.get("entityType") ?? ""; const entityId = url.searchParams.get("entityId") ?? "";
  if (!isEntityType(entityType) || !idSchema.safeParse(entityId).success) return NextResponse.json({ message: "คำขอรูปภาพไม่ถูกต้อง" }, { status: 400 });
  if (entityType !== "projects" && !await authorise()) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const [rows] = await db().execute<RowDataPacket[]>("SELECT storage_key, mime_type FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind='cover' LIMIT 1", [entityType, entityId]);
  const media = rows[0]; if (!media) return NextResponse.json({ message: "ยังไม่มีรูปภาพ" }, { status: 404 });
  try { const file = await readFile(path.join(process.cwd(), "public", String(media.storage_key))); return new Response(file, { headers: { "Content-Type": String(media.mime_type), "Cache-Control": "private, max-age=3600" } }); } catch { return NextResponse.json({ message: "ไม่พบไฟล์รูปภาพบนเครื่อง" }, { status: 404 }); }
}

export async function POST(request: Request) {
  if (!await authorise()) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const form = await request.formData(); const entityType = String(form.get("entityType") ?? ""); const entityId = String(form.get("entityId") ?? ""); const file = form.get("file");
  if (!isEntityType(entityType) || !idSchema.safeParse(entityId).success || !(file instanceof File)) return NextResponse.json({ message: "ข้อมูลอัปโหลดไม่ถูกต้อง" }, { status: 400 });
  const extension = mimeExtensions[file.type]; if (!extension) return NextResponse.json({ message: "รองรับเฉพาะไฟล์ JPG, PNG และ WEBP" }, { status: 400 });
  if (!file.size || file.size > 5 * 1024 * 1024) return NextResponse.json({ message: "ไฟล์รูปต้องมีขนาดไม่เกิน 5 MB" }, { status: 400 });
  const [entityRows] = await db().execute<RowDataPacket[]>(`SELECT id FROM ${entities[entityType]} WHERE id=? LIMIT 1`, [entityId]);
  if (!entityRows.length) return NextResponse.json({ message: "ไม่พบข้อมูลที่ต้องการผูกรูปภาพ" }, { status: 404 });
  const [oldRows] = await db().execute<RowDataPacket[]>("SELECT storage_key FROM media_assets WHERE entity_type=? AND entity_id=? AND media_kind='cover' LIMIT 1", [entityType, entityId]);
  const storageKey = `uploads/${randomUUID()}.${extension}`;
  try {
    await mkdir(uploadsDirectory, { recursive: true });
    await writeFile(path.join(process.cwd(), "public", storageKey), Buffer.from(await file.arrayBuffer()));
    await db().execute("INSERT INTO media_assets (id, entity_type, entity_id, media_kind, original_name, mime_type, file_size, storage_key) VALUES (UUID(), ?, ?, 'cover', ?, ?, ?, ?) ON DUPLICATE KEY UPDATE original_name=VALUES(original_name), mime_type=VALUES(mime_type), file_size=VALUES(file_size), storage_key=VALUES(storage_key), updated_at=CURRENT_TIMESTAMP", [entityType, entityId, file.name || `upload.${extension}`, file.type, file.size, storageKey]);
    const oldKey = oldRows[0]?.storage_key; if (oldKey && oldKey !== storageKey) await unlink(path.join(process.cwd(), "public", String(oldKey))).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ message: "อัปโหลดรูปภาพไม่สำเร็จ" }, { status: 500 }); }
}
