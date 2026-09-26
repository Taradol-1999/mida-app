import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const projectIdsSchema = z.array(z.string().uuid()).max(50);

async function superAdmin() {
  const user = await getSession();
  if (!user) return { error: NextResponse.json({ message: "กรุณาเข้าสู่ระบบด้วยสิทธิ์ผู้ดูแล" }, { status: 401 }) };
  if (user.role !== "SUPER_ADMIN")
    return { error: NextResponse.json({ message: "เฉพาะ Super Admin เท่านั้น" }, { status: 403 }) };
  return { user };
}

export async function GET() {
  const access = await superAdmin();
  if ("error" in access) return access.error;
  const [projects, selections] = await Promise.all([
    prisma.project.findMany({
      where: { status: { not: "ARCHIVED" } },
      select: { id: true, name_th: true, location: true, status: true },
      orderBy: { name_th: "asc" },
    }),
    prisma.homepageProject.findMany({ select: { project_id: true }, orderBy: { sort_order: "asc" } }),
  ]);
  return NextResponse.json({ projects, project_ids: selections.map((item) => item.project_id) });
}

export async function PUT(request: Request) {
  const access = await superAdmin();
  if ("error" in access) return access.error;
  const parsed = projectIdsSchema.safeParse(((await request.json()) as { project_ids?: unknown }).project_ids);
  if (!parsed.success) return NextResponse.json({ message: "รายการโครงการไม่ถูกต้อง" }, { status: 400 });
  const projectIds = [...new Set(parsed.data)];
  const count = await prisma.project.count({ where: { id: { in: projectIds }, status: { not: "ARCHIVED" } } });
  if (count !== projectIds.length)
    return NextResponse.json({ message: "พบโครงการที่ไม่สามารถนำมาแสดงได้" }, { status: 400 });
  await prisma.$transaction([
    prisma.homepageProject.deleteMany(),
    prisma.homepageProject.createMany({
      data: projectIds.map((project_id, sort_order) => ({ project_id, sort_order })),
    }),
  ]);
  return NextResponse.json({ ok: true });
}
