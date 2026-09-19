import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

const resources = ["projects", "house-types", "facilities", "promotions", "news", "leads", "content", "users"] as const;
type Resource = (typeof resources)[number];
type RouteContext = { params: Promise<{ resource: string }> };
const idSchema = z.string().uuid();

function apiError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
function isResource(value: string): value is Resource {
  return resources.includes(value as Resource);
}
function value(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}
function nullable(body: Record<string, unknown>, key: string) {
  const result = value(body, key);
  return result || null;
}
function numberValue(body: Record<string, unknown>, key: string) {
  const raw = value(body, key);
  if (!raw) return null;
  const result = Number(raw);
  return Number.isFinite(result) ? result : null;
}
function boolValue(body: Record<string, unknown>, key: string) {
  return body[key] === true || body[key] === "true" || body[key] === 1;
}
function mysqlDate(body: Record<string, unknown>, key: string) {
  const result = value(body, key);
  return result ? result.replace("T", " ") : null;
}

async function authorise(resource: string) {
  if (!isResource(resource)) return { error: apiError("ไม่พบทรัพยากรที่ร้องขอ", 404) };
  const user = await getSession();
  if (!user || user.role === "USER") return { error: apiError("กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล", 401) };
  if (resource === "users" && user.role !== "SUPER_ADMIN")
    return { error: apiError("เฉพาะ Super Admin เท่านั้น", 403) };
  return { user, resource };
}

async function list(resource: Resource) {
  const pool = db();
  const projectOptions = async () =>
    (
      await pool.query<RowDataPacket[]>("SELECT id, name_th FROM projects WHERE status <> 'ARCHIVED' ORDER BY name_th")
    )[0];
  switch (resource) {
    case "projects":
      return { rows: (await pool.query<RowDataPacket[]>("SELECT * FROM projects ORDER BY updated_at DESC"))[0] };
    case "house-types":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT h.*, p.name_th AS project_name FROM house_types h JOIN projects p ON p.id=h.project_id ORDER BY p.name_th, h.name",
          )
        )[0],
        projectOptions: await projectOptions(),
      };
    case "facilities":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT f.*, p.name_th AS project_name FROM facilities f JOIN projects p ON p.id=f.project_id ORDER BY p.name_th, f.sort_order",
          )
        )[0],
        projectOptions: await projectOptions(),
      };
    case "promotions":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT x.*, p.name_th AS project_name FROM promotions x LEFT JOIN projects p ON p.id=x.project_id ORDER BY x.created_at DESC",
          )
        )[0],
        projectOptions: await projectOptions(),
      };
    case "news":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT n.*, p.name_th AS project_name FROM news_items n LEFT JOIN projects p ON p.id=n.project_id ORDER BY n.published_at DESC",
          )
        )[0],
        projectOptions: await projectOptions(),
      };
    case "leads":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT l.*, p.name_th AS project_name FROM leads l LEFT JOIN projects p ON p.id=l.project_id ORDER BY l.created_at DESC",
          )
        )[0],
      };
    case "content":
      return { rows: (await pool.query<RowDataPacket[]>("SELECT * FROM site_content ORDER BY content_key"))[0] };
    case "users":
      return {
        rows: (
          await pool.query<RowDataPacket[]>(
            "SELECT id, name, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC",
          )
        )[0],
      };
  }
}

function csvEscape(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  if (access.resource === "leads" && new URL(request.url).searchParams.get("format") === "csv") {
    const { rows } = await list("leads");
    const header = ["ชื่อ", "โทรศัพท์", "อีเมล", "โครงการ", "งบประมาณ", "สถานะ", "วันที่"];
    const lines = rows.map((row) =>
      [row.name, row.phone, row.email, row.project_name, row.budget, row.status, row.created_at]
        .map(csvEscape)
        .join(","),
    );
    return new Response(`\uFEFF${header.map(csvEscape).join(",")}\n${lines.join("\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=mida-leads.csv",
      },
    });
  }
  return NextResponse.json(await list(access.resource));
}

export async function POST(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  const body = (await request.json()) as Record<string, unknown>;
  const pool = db();
  try {
    switch (access.resource) {
      case "projects":
        await pool.execute(
          "INSERT INTO projects (id, slug, name_th, name_en, location, property_type, starting_price, status, is_featured, is_new, description) VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            value(body, "slug"),
            value(body, "name_th"),
            nullable(body, "name_en"),
            value(body, "location"),
            value(body, "property_type"),
            numberValue(body, "starting_price"),
            value(body, "status"),
            boolValue(body, "is_featured"),
            boolValue(body, "is_new"),
            nullable(body, "description"),
          ],
        );
        break;
      case "house-types":
        await pool.execute(
          "INSERT INTO house_types (id, project_id, name, bedrooms, bathrooms, usable_area_sqm, starting_price) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
          [
            value(body, "project_id"),
            value(body, "name"),
            numberValue(body, "bedrooms"),
            numberValue(body, "bathrooms"),
            numberValue(body, "usable_area_sqm"),
            numberValue(body, "starting_price"),
          ],
        );
        break;
      case "facilities":
        await pool.execute(
          "INSERT INTO facilities (id, project_id, name, description, sort_order) VALUES (UUID(), ?, ?, ?, ?)",
          [
            value(body, "project_id"),
            value(body, "name"),
            nullable(body, "description"),
            numberValue(body, "sort_order") ?? 0,
          ],
        );
        break;
      case "promotions":
        await pool.execute(
          "INSERT INTO promotions (id, project_id, title, body, starts_at, ends_at, is_published) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
          [
            nullable(body, "project_id"),
            value(body, "title"),
            nullable(body, "body"),
            mysqlDate(body, "starts_at"),
            mysqlDate(body, "ends_at"),
            boolValue(body, "is_published"),
          ],
        );
        break;
      case "news":
        await pool.execute(
          "INSERT INTO news_items (id, project_id, category, title, body, published_at, is_published) VALUES (UUID(), ?, ?, ?, ?, ?, ?)",
          [
            nullable(body, "project_id"),
            value(body, "category") || "NEWS",
            value(body, "title"),
            nullable(body, "body"),
            mysqlDate(body, "published_at"),
            boolValue(body, "is_published"),
          ],
        );
        break;
      case "content":
        await pool.execute("INSERT INTO site_content (id, content_key, title, body) VALUES (UUID(), ?, ?, ?)", [
          value(body, "content_key"),
          value(body, "title"),
          nullable(body, "body"),
        ]);
        break;
      case "users": {
        const password = value(body, "password");
        if (password.length < 8) return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
        await pool.execute(
          "INSERT INTO users (id, name, email, password_hash, role, is_active) VALUES (UUID(), ?, ?, ?, ?, ?)",
          [
            value(body, "name"),
            value(body, "email"),
            await bcrypt.hash(password, 12),
            value(body, "role") || "ADMIN",
            boolValue(body, "is_active"),
          ],
        );
        break;
      }
      case "leads":
        return apiError("รายชื่อผู้สนใจมาจากแบบฟอร์มหน้าเว็บไซต์", 405);
    }
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return apiError("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบข้อมูลซ้ำหรือข้อมูลที่ซ้ำกัน", 400);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  const body = (await request.json()) as Record<string, unknown>;
  const id = value(body, "id");
  if (!idSchema.safeParse(id).success) return apiError("รหัสข้อมูลไม่ถูกต้อง", 400);
  const pool = db();
  try {
    switch (access.resource) {
      case "projects":
        await pool.execute(
          "UPDATE projects SET slug=?, name_th=?, name_en=?, location=?, property_type=?, starting_price=?, status=?, is_featured=?, is_new=?, description=? WHERE id=?",
          [
            value(body, "slug"),
            value(body, "name_th"),
            nullable(body, "name_en"),
            value(body, "location"),
            value(body, "property_type"),
            numberValue(body, "starting_price"),
            value(body, "status"),
            boolValue(body, "is_featured"),
            boolValue(body, "is_new"),
            nullable(body, "description"),
            id,
          ],
        );
        break;
      case "house-types":
        await pool.execute(
          "UPDATE house_types SET project_id=?, name=?, bedrooms=?, bathrooms=?, usable_area_sqm=?, starting_price=? WHERE id=?",
          [
            value(body, "project_id"),
            value(body, "name"),
            numberValue(body, "bedrooms"),
            numberValue(body, "bathrooms"),
            numberValue(body, "usable_area_sqm"),
            numberValue(body, "starting_price"),
            id,
          ],
        );
        break;
      case "facilities":
        await pool.execute("UPDATE facilities SET project_id=?, name=?, description=?, sort_order=? WHERE id=?", [
          value(body, "project_id"),
          value(body, "name"),
          nullable(body, "description"),
          numberValue(body, "sort_order") ?? 0,
          id,
        ]);
        break;
      case "promotions":
        await pool.execute(
          "UPDATE promotions SET project_id=?, title=?, body=?, starts_at=?, ends_at=?, is_published=? WHERE id=?",
          [
            nullable(body, "project_id"),
            value(body, "title"),
            nullable(body, "body"),
            mysqlDate(body, "starts_at"),
            mysqlDate(body, "ends_at"),
            boolValue(body, "is_published"),
            id,
          ],
        );
        break;
      case "news":
        await pool.execute(
          "UPDATE news_items SET project_id=?, category=?, title=?, body=?, published_at=?, is_published=? WHERE id=?",
          [
            nullable(body, "project_id"),
            value(body, "category") || "NEWS",
            value(body, "title"),
            nullable(body, "body"),
            mysqlDate(body, "published_at"),
            boolValue(body, "is_published"),
            id,
          ],
        );
        break;
      case "leads":
        await pool.execute("UPDATE leads SET status=? WHERE id=?", [value(body, "status") || "NEW", id]);
        break;
      case "content":
        await pool.execute("UPDATE site_content SET content_key=?, title=?, body=? WHERE id=?", [
          value(body, "content_key"),
          value(body, "title"),
          nullable(body, "body"),
          id,
        ]);
        break;
      case "users": {
        if (id === access.user.id) return apiError("ไม่สามารถแก้ไขสิทธิ์ของบัญชีที่กำลังใช้งานจากหน้านี้", 400);
        const password = value(body, "password");
        if (password) {
          if (password.length < 8) return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
          await pool.execute("UPDATE users SET name=?, email=?, password_hash=?, role=?, is_active=? WHERE id=?", [
            value(body, "name"),
            value(body, "email"),
            await bcrypt.hash(password, 12),
            value(body, "role") || "ADMIN",
            boolValue(body, "is_active"),
            id,
          ]);
        } else
          await pool.execute("UPDATE users SET name=?, email=?, role=?, is_active=? WHERE id=?", [
            value(body, "name"),
            value(body, "email"),
            value(body, "role") || "ADMIN",
            boolValue(body, "is_active"),
            id,
          ]);
        break;
      }
    }
    return NextResponse.json({ ok: true });
  } catch {
    return apiError("แก้ไขข้อมูลไม่สำเร็จ", 400);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  const body = (await request.json()) as { id?: string };
  const parsedId = idSchema.safeParse(body.id);
  if (!parsedId.success) return apiError("รหัสข้อมูลไม่ถูกต้อง", 400);
  const id = parsedId.data;
  if (access.resource === "users" && id === access.user.id) return apiError("ไม่สามารถลบบัญชีที่กำลังใช้งาน", 400);
  const table: Record<Resource, string> = {
    projects: "projects",
    "house-types": "house_types",
    facilities: "facilities",
    promotions: "promotions",
    news: "news_items",
    leads: "leads",
    content: "site_content",
    users: "users",
  };
  const [result] = await db().execute<ResultSetHeader>(`DELETE FROM ${table[access.resource]} WHERE id=?`, [id]);
  return result.affectedRows ? NextResponse.json({ ok: true }) : apiError("ไม่พบข้อมูล", 404);
}
