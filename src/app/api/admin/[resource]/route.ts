import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { LeadStatus, NewsCategory, ProjectStatus, PropertyType } from "@/generated/prisma/client";
import { isUserRole } from "@/lib/user-roles";
import { getSession, type SessionUser } from "@/lib/auth";
import { canAccessProject, canAccessRecord, projectScope, projectContentScope } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

const resources = ["projects", "house-types", "facilities", "promotions", "news", "leads", "content", "users"] as const;
type Resource = (typeof resources)[number];
type RouteContext = { params: Promise<{ resource: string }> };
const idSchema = z.string().uuid();
const projectTagOptions = ["โครงการแนะนำ", "โครงการล่าสุด", "พร้อมเข้าอยู่ได้ทันที"] as const;

function apiError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}
async function assignedProjectIds(body: Record<string, unknown>): Promise<string[] | null> {
  if (body.role === "SUPER_ADMIN") return [];
  const parsed = z.array(idSchema).min(1).safeParse(body.project_ids);
  if (!parsed.success) return null;
  const ids = [...new Set(parsed.data)];
  const count = await prisma.project.count({ where: { id: { in: ids } } });
  return count === ids.length ? ids : null;
}
function isResource(value: string): value is Resource {
  return resources.includes(value as Resource);
}
function value(body: Record<string, unknown>, key: string) {
  return String(body[key] ?? "").trim();
}
function nullable(body: Record<string, unknown>, key: string) {
  return value(body, key) || null;
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
function tagValue(body: Record<string, unknown>) {
  const submittedTags = Array.isArray(body.tags)
    ? body.tags.map(String)
    : value(body, "tags")
        .split(",")
        .map((tag) => tag.trim());
  const uniqueTags = new Set(submittedTags);
  return projectTagOptions.filter((tag) => uniqueTags.has(tag));
}
function dateValue(body: Record<string, unknown>, key: string) {
  const raw = value(body, key);
  return raw ? new Date(raw) : null;
}

async function authorise(resource: string) {
  if (!isResource(resource)) return { error: apiError("ไม่พบทรัพยากรที่ร้องขอ", 404) };
  const user = await getSession();
  if (!user) return { error: apiError("กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล", 401) };
  if ((resource === "users" || resource === "content") && user.role !== "SUPER_ADMIN")
    return { error: apiError("เฉพาะ Super Admin เท่านั้น", 403) };
  return { user, resource };
}

async function projectOptions(user: SessionUser) {
  const projects = await prisma.project.findMany({
    where: { ...projectScope(user) },
    select: { id: true, name_th: true },
    orderBy: { name_th: "asc" },
  });
  return projects;
}

async function listLeads(user: SessionUser) {
  const rows = await prisma.lead.findMany({
    where: projectContentScope(user),
    include: { project: { select: { name_th: true } } },
    orderBy: { created_at: "desc" },
  });
  return { rows: rows.map(({ project, ...row }) => ({ ...row, project_name: project?.name_th ?? null })) };
}

async function list(resource: Resource, user: SessionUser) {
  switch (resource) {
    case "projects":
      return { rows: await prisma.project.findMany({ where: projectScope(user), orderBy: { updated_at: "desc" } }) };
    case "house-types": {
      const rows = await prisma.houseType.findMany({
        where: projectContentScope(user),
        include: { project: { select: { name_th: true } } },
        orderBy: [{ project: { name_th: "asc" } }, { name: "asc" }],
      });
      return {
        rows: rows.map(({ project, ...row }) => ({ ...row, project_name: project.name_th })),
        projectOptions: await projectOptions(user),
      };
    }
    case "facilities": {
      const rows = await prisma.facility.findMany({
        where: projectContentScope(user),
        include: { project: { select: { name_th: true } } },
        orderBy: [{ project: { name_th: "asc" } }, { sort_order: "asc" }],
      });
      return {
        rows: rows.map(({ project, ...row }) => ({ ...row, project_name: project.name_th })),
        projectOptions: await projectOptions(user),
      };
    }
    case "promotions": {
      const rows = await prisma.promotion.findMany({
        where: projectContentScope(user),
        include: { project: { select: { name_th: true } } },
        orderBy: { created_at: "desc" },
      });
      const mediaCounts = await prisma.mediaAsset.groupBy({
        by: ["entity_id"],
        where: { entity_type: "promotions", entity_id: { in: rows.map((row) => row.id) }, media_kind: "gallery" },
        _count: { _all: true },
      });
      const countById = new Map(mediaCounts.map((item) => [item.entity_id, item._count._all]));
      return {
        rows: rows.map(({ project, ...row }) => ({
          ...row,
          project_name: project?.name_th ?? null,
          media_count: countById.get(row.id) ?? 0,
        })),
        projectOptions: await projectOptions(user),
      };
    }
    case "news": {
      const rows = await prisma.newsItem.findMany({
        where: projectContentScope(user),
        include: { project: { select: { name_th: true } } },
        orderBy: { published_at: "desc" },
      });
      const mediaCounts = await prisma.mediaAsset.groupBy({
        by: ["entity_id"],
        where: { entity_type: "news", entity_id: { in: rows.map((row) => row.id) }, media_kind: "gallery" },
        _count: { _all: true },
      });
      const countById = new Map(mediaCounts.map((item) => [item.entity_id, item._count._all]));
      return {
        rows: rows.map(({ project, ...row }) => ({
          ...row,
          project_name: project?.name_th ?? null,
          media_count: countById.get(row.id) ?? 0,
        })),
        projectOptions: await projectOptions(user),
      };
    }
    case "leads":
      return listLeads(user);
    case "content":
      return { rows: await prisma.siteContent.findMany({ orderBy: { content_key: "asc" } }) };
    case "users":
      return {
        projectOptions: await projectOptions(user),
        rows: await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            is_active: true,
            created_at: true,
            updated_at: true,
            projects: { select: { project_id: true, project: { select: { name_th: true } } } },
          },
          orderBy: { created_at: "desc" },
        }),
      };
  }
}

function csvEscape(input: unknown) {
  return `"${String(input ?? "").replaceAll('"', '""')}"`;
}

export async function GET(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  if (access.resource === "leads" && new URL(request.url).searchParams.get("format") === "csv") {
    const projectId = new URL(request.url).searchParams.get("projectId");
    const listed = await listLeads(access.user);
    const rows = projectId ? listed.rows.filter((row) => String(row.project_id) === projectId) : listed.rows;
    const header = [
      "ชื่อ",
      "โทรศัพท์",
      "อีเมล",
      "สมาชิกครอบครัว",
      "จังหวัด",
      "อำเภอ",
      "ตำบล",
      "ประเภทที่พัก",
      "โครงการ",
      "งบประมาณ",
      "วันที่สะดวก",
      "เวลาที่สะดวก",
      "รับข่าวสาร",
      "ยินยอมให้ติดต่อ",
      "สถานะ",
      "วันที่ลงทะเบียน",
    ];
    const lines = rows.map((row) =>
      [
        row.name,
        row.phone,
        row.email,
        row.family_members,
        row.province,
        row.district,
        row.subdistrict,
        row.residence_type,
        row.project_name,
        row.budget,
        row.preferred_contact_date,
        row.preferred_contact_time,
        row.consent_news,
        row.consent_contact,
        row.status,
        row.created_at,
      ]
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
  return NextResponse.json(await list(access.resource, access.user));
}

export async function POST(request: Request, context: RouteContext) {
  const { resource: resourceParam } = await context.params;
  const access = await authorise(resourceParam);
  if ("error" in access) return access.error;
  const body = (await request.json()) as Record<string, unknown>;
  if (
    access.user.role !== "SUPER_ADMIN" &&
    (access.resource === "projects" || !canAccessProject(access.user, value(body, "project_id")))
  )
    return apiError("ไม่มีสิทธิ์จัดการโครงการนี้", 403);
  try {
    let createdId: string | undefined;
    switch (access.resource) {
      case "projects": {
        const row = await prisma.project.create({
          data: {
            slug: value(body, "slug"),
            name_th: value(body, "name_th"),
            name_en: nullable(body, "name_en"),
            location: value(body, "location"),
            latitude: numberValue(body, "latitude"),
            longitude: numberValue(body, "longitude"),
            property_type: value(body, "property_type") as PropertyType,
            starting_price: numberValue(body, "starting_price"),
            status: value(body, "status") as ProjectStatus,
            is_featured: boolValue(body, "is_featured"),
            is_new: boolValue(body, "is_new"),
            tags: tagValue(body),
            description: nullable(body, "description"),
          },
        });
        createdId = row.id;
        break;
      }
      case "house-types": {
        const row = await prisma.houseType.create({
          data: {
            project_id: value(body, "project_id"),
            name: value(body, "name"),
            description: nullable(body, "description"),
            bedrooms: numberValue(body, "bedrooms"),
            bathrooms: numberValue(body, "bathrooms"),
            usable_area_sqm: numberValue(body, "usable_area_sqm"),
            starting_price: numberValue(body, "starting_price"),
          },
        });
        createdId = row.id;
        break;
      }
      case "facilities":
        createdId = (
          await prisma.facility.create({
            data: {
              project_id: value(body, "project_id"),
              name: value(body, "name"),
              description: nullable(body, "description"),
              sort_order: numberValue(body, "sort_order") ?? 0,
            },
          })
        ).id;
        break;
      case "promotions":
        createdId = (
          await prisma.promotion.create({
            data: {
              project_id: nullable(body, "project_id"),
              title: value(body, "title"),
              body: nullable(body, "body"),
              starts_at: dateValue(body, "starts_at"),
              ends_at: dateValue(body, "ends_at"),
              is_published: boolValue(body, "is_published"),
            },
          })
        ).id;
        break;
      case "news":
        createdId = (
          await prisma.newsItem.create({
            data: {
              project_id: nullable(body, "project_id"),
              category: (value(body, "category") || "NEWS") as NewsCategory,
              title: value(body, "title"),
              body: nullable(body, "body"),
              published_at: dateValue(body, "published_at"),
              is_published: boolValue(body, "is_published"),
            },
          })
        ).id;
        break;
      case "content":
        createdId = (
          await prisma.siteContent.create({
            data: {
              content_key: value(body, "content_key"),
              title: value(body, "title"),
              body: nullable(body, "body"),
            },
          })
        ).id;
        break;
      case "users": {
        if (!isUserRole(body.role)) return apiError("กรุณาเลือก Marketing หรือ Super Admin", 400);
        const projectIds = await assignedProjectIds(body);
        if (!projectIds) return apiError("กรุณาเลือกโครงการที่ถูกต้องอย่างน้อย 1 โครงการสำหรับ Marketing", 400);
        const password = value(body, "password");
        if (password.length < 8) return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
        createdId = (
          await prisma.user.create({
            data: {
              name: value(body, "name"),
              email: value(body, "email"),
              password_hash: await bcrypt.hash(password, 12),
              role: body.role,
              is_active: boolValue(body, "is_active"),
              projects: { create: projectIds.map((project_id) => ({ project_id })) },
            },
          })
        ).id;
        break;
      }
      case "leads":
        return apiError("รายชื่อผู้สนใจมาจากแบบฟอร์มหน้าเว็บไซต์", 405);
    }
    return NextResponse.json({ ok: true, id: createdId }, { status: 201 });
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
  if (
    !(await canAccessRecord(access.user, access.resource, id)) ||
    ("project_id" in body && !canAccessProject(access.user, nullable(body, "project_id")))
  )
    return apiError("ไม่มีสิทธิ์จัดการโครงการนี้", 403);
  try {
    switch (access.resource) {
      case "projects":
        await prisma.project.update({
          where: { id },
          data: {
            slug: value(body, "slug"),
            name_th: value(body, "name_th"),
            name_en: nullable(body, "name_en"),
            location: value(body, "location"),
            latitude: numberValue(body, "latitude"),
            longitude: numberValue(body, "longitude"),
            property_type: value(body, "property_type") as PropertyType,
            starting_price: numberValue(body, "starting_price"),
            status: value(body, "status") as ProjectStatus,
            is_featured: boolValue(body, "is_featured"),
            is_new: boolValue(body, "is_new"),
            tags: tagValue(body),
            description: nullable(body, "description"),
          },
        });
        break;
      case "house-types":
        await prisma.houseType.update({
          where: { id },
          data: {
            project_id: value(body, "project_id"),
            name: value(body, "name"),
            description: nullable(body, "description"),
            bedrooms: numberValue(body, "bedrooms"),
            bathrooms: numberValue(body, "bathrooms"),
            usable_area_sqm: numberValue(body, "usable_area_sqm"),
            starting_price: numberValue(body, "starting_price"),
          },
        });
        break;
      case "facilities":
        await prisma.facility.update({
          where: { id },
          data: {
            project_id: value(body, "project_id"),
            name: value(body, "name"),
            description: nullable(body, "description"),
            sort_order: numberValue(body, "sort_order") ?? 0,
          },
        });
        break;
      case "promotions":
        await prisma.promotion.update({
          where: { id },
          data: {
            project_id: nullable(body, "project_id"),
            title: value(body, "title"),
            body: nullable(body, "body"),
            starts_at: dateValue(body, "starts_at"),
            ends_at: dateValue(body, "ends_at"),
            is_published: boolValue(body, "is_published"),
          },
        });
        break;
      case "news":
        await prisma.newsItem.update({
          where: { id },
          data: {
            project_id: nullable(body, "project_id"),
            category: (value(body, "category") || "NEWS") as NewsCategory,
            title: value(body, "title"),
            body: nullable(body, "body"),
            published_at: dateValue(body, "published_at"),
            is_published: boolValue(body, "is_published"),
          },
        });
        break;
      case "leads":
        await prisma.lead.update({ where: { id }, data: { status: (value(body, "status") || "NEW") as LeadStatus } });
        break;
      case "content":
        await prisma.siteContent.update({
          where: { id },
          data: { content_key: value(body, "content_key"), title: value(body, "title"), body: nullable(body, "body") },
        });
        break;
      case "users": {
        if (!isUserRole(body.role)) return apiError("กรุณาเลือก Marketing หรือ Super Admin", 400);
        const projectIds = await assignedProjectIds(body);
        if (!projectIds) return apiError("กรุณาเลือกโครงการที่ถูกต้องอย่างน้อย 1 โครงการสำหรับ Marketing", 400);
        if (id === access.user.id) return apiError("ไม่สามารถแก้ไขสิทธิ์ของบัญชีที่กำลังใช้งานจากหน้านี้", 400);
        const password = value(body, "password");
        if (password && password.length < 8) return apiError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร", 400);
        await prisma.user.update({
          where: { id },
          data: {
            name: value(body, "name"),
            email: value(body, "email"),
            role: body.role,
            is_active: boolValue(body, "is_active"),
            projects: { deleteMany: {}, create: projectIds.map((project_id) => ({ project_id })) },
            ...(password ? { password_hash: await bcrypt.hash(password, 12) } : {}),
          },
        });
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
  const parsedId = idSchema.safeParse(((await request.json()) as { id?: string }).id);
  if (!parsedId.success) return apiError("รหัสข้อมูลไม่ถูกต้อง", 400);
  const id = parsedId.data;
  if (!(await canAccessRecord(access.user, access.resource, id))) return apiError("ไม่มีสิทธิ์จัดการโครงการนี้", 403);
  if (access.resource === "users" && id === access.user.id) return apiError("ไม่สามารถลบบัญชีที่กำลังใช้งาน", 400);
  try {
    switch (access.resource) {
      case "projects":
        await prisma.project.delete({ where: { id } });
        break;
      case "house-types":
        await prisma.houseType.delete({ where: { id } });
        break;
      case "facilities":
        await prisma.facility.delete({ where: { id } });
        break;
      case "promotions":
        await prisma.promotion.delete({ where: { id } });
        break;
      case "news":
        await prisma.newsItem.delete({ where: { id } });
        break;
      case "leads":
        await prisma.lead.delete({ where: { id } });
        break;
      case "content":
        await prisma.siteContent.delete({ where: { id } });
        break;
      case "users":
        await prisma.user.delete({ where: { id } });
        break;
    }
    return NextResponse.json({ ok: true });
  } catch {
    return apiError("ไม่พบข้อมูล", 404);
  }
}
