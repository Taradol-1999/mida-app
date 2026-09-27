import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getClientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";

const activitySchema = z.object({
  action: z.enum(["PAGE_VISIT", "PAGE_DURATION", "HOUSE_TYPE_VIEW", "SECTION_VIEW", "SECTION_DURATION", "ADMIN_VIEW"]),
  path: z.string().startsWith("/").max(255),
  session_key: z.string().min(8).max(100).optional(),
  duration_seconds: z.number().int().min(0).max(86_400).optional(),
});

async function activityBody(request: Request) {
  try {
    return await request.json();
  } catch {
    try {
      return JSON.parse(await request.text());
    } catch {
      return null;
    }
  }
}

async function projectIdForPath(pathname: string) {
  const projectSlug = pathname.match(/^\/projects\/([^/?#]+)/)?.[1];
  if (projectSlug) {
    const project = await prisma.project.findUnique({
      where: { slug: decodeURIComponent(projectSlug) },
      select: { id: true },
    });
    return project?.id ?? null;
  }
  const projectId = pathname.match(/^\/admin\/project\/([0-9a-f-]{36})(?:\/|$)/i)?.[1];
  return projectId ?? null;
}

function activityDetail(
  action: "PAGE_VISIT" | "PAGE_DURATION" | "HOUSE_TYPE_VIEW" | "SECTION_VIEW" | "SECTION_DURATION" | "ADMIN_VIEW",
  path: string,
  area: "ADMIN" | "PUBLIC",
) {
  const pageLabel = area === "ADMIN" ? "หน้าหลังบ้าน" : "หน้าเว็บไซต์";
  if (action === "ADMIN_VIEW") return `ดู${pageLabel}: ${path}`;
  if (action === "PAGE_VISIT") return `เข้าชม${pageLabel}: ${path}`;
  if (action === "PAGE_DURATION") return `บันทึกเวลาใช้งาน${pageLabel}: ${path}`;
  if (action === "HOUSE_TYPE_VIEW") return "เปิดดูแบบบ้าน";
  if (action === "SECTION_VIEW") return "เปิดดูหัวข้อในหน้าโครงการ";
  return "บันทึกเวลาเปิดดูหัวข้อในหน้าโครงการ";
}

/** Public endpoint: records only anonymous session activity and never accepts account identity from the browser. */
export async function POST(request: Request) {
  const parsed = activitySchema.safeParse(await activityBody(request));
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const user = await getSession();
  const path = parsed.data.path;
  const area = path.startsWith("/admin") ? "ADMIN" : "PUBLIC";
  await prisma.activityLog.create({
    data: {
      area,
      action: parsed.data.action,
      path,
      user_id: user?.id,
      project_id: await projectIdForPath(path),
      session_key: parsed.data.session_key ?? null,
      duration_seconds:
        parsed.data.action === "PAGE_DURATION" || parsed.data.action === "SECTION_DURATION"
          ? (parsed.data.duration_seconds ?? null)
          : null,
      ip_address: getClientIp(request),
      detail: activityDetail(parsed.data.action, path, area),
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
