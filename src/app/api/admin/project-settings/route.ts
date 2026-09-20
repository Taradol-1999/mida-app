import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { resolveGoogleMapsCoordinates } from "@/lib/map-coordinates";

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
  return user && user.role !== "USER" ? user : null;
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
  if (!(await authorise())) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  if (!idSchema.safeParse(projectId).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  const [rows] = await db().execute<RowDataPacket[]>(
    `SELECT s.*, p.latitude, p.longitude
     FROM projects p LEFT JOIN project_settings s ON s.project_id=p.id
     WHERE p.id=? LIMIT 1`,
    [projectId],
  );
  return NextResponse.json({ settings: rows[0] ?? null });
}

export async function PUT(request: Request) {
  if (!(await authorise())) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 });
  const body = (await request.json()) as Record<string, unknown>;
  const projectId = String(body.project_id ?? "");
  if (!idSchema.safeParse(projectId).success)
    return NextResponse.json({ message: "รหัสโครงการไม่ถูกต้อง" }, { status: 400 });
  const [projects] = await db().execute<RowDataPacket[]>("SELECT id FROM projects WHERE id=? LIMIT 1", [projectId]);
  if (!projects.length) return NextResponse.json({ message: "ไม่พบโครงการ" }, { status: 404 });
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

  const connection = await db().getConnection();
  try {
    await connection.beginTransaction();
    if (submittedFields.length) {
      const values = submittedFields.map((field) => nullable(body, field));
      await connection.execute(
        `INSERT INTO project_settings (project_id, ${submittedFields.join(", ")}) VALUES (?, ${submittedFields.map(() => "?").join(", ")}) ON DUPLICATE KEY UPDATE ${submittedFields.map((field) => `${field}=VALUES(${field})`).join(", ")}`,
        [projectId, ...values],
      );
    }
    if (hasCoordinates || mapCoordinates) {
      await connection.execute("UPDATE projects SET latitude=?, longitude=? WHERE id=?", [
        latitude,
        longitude,
        projectId,
      ]);
    }
    await connection.commit();
  } catch {
    await connection.rollback();
    return NextResponse.json({ message: "บันทึกข้อมูลไม่สำเร็จ" }, { status: 500 });
  } finally {
    connection.release();
  }
  return NextResponse.json({ ok: true, coordinates: mapCoordinates });
}
