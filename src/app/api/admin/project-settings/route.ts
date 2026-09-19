import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const idSchema = z.string().uuid();
const fields = ["hero_title_th", "hero_title_en", "hero_subtitle_th", "hero_subtitle_en", "phone", "email", "map_url", "nearby_places_th", "nearby_places_en"] as const;

async function authorise() { const user = await getSession(); return user && user.role !== "USER" ? user : null; }
function nullable(body: Record<string, unknown>, field: string) { const value = String(body[field] ?? "").trim(); return value || null; }

export async function GET(request: Request) {
  if (!await authorise()) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!idSchema.safeParse(projectId).success) return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  const [rows] = await db().execute<RowDataPacket[]>("SELECT * FROM project_settings WHERE project_id=? LIMIT 1", [projectId]);
  return NextResponse.json({ settings: rows[0] ?? null });
}

export async function PUT(request: Request) {
  if (!await authorise()) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const body = await request.json() as Record<string, unknown>; const projectId = String(body.project_id ?? "");
  if (!idSchema.safeParse(projectId).success) return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  const [projects] = await db().execute<RowDataPacket[]>("SELECT id FROM projects WHERE id=? LIMIT 1", [projectId]);
  if (!projects.length) return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
  const values = fields.map((field) => nullable(body, field));
  await db().execute(`INSERT INTO project_settings (project_id, ${fields.join(", ")}) VALUES (?, ${fields.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${fields.map((field) => `${field}=VALUES(${field})`).join(", ")}`, [projectId, ...values]);
  return NextResponse.json({ ok: true });
}
