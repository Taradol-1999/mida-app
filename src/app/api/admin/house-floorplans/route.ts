import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { houseFloorplanKey, houseFloorplanSchema, readHouseFloorplan } from "@/lib/house-floorplan";
import { canAccessRecord } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

const idSchema = z.string().uuid();

export async function GET(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const houseTypeId = new URL(request.url).searchParams.get("houseTypeId") ?? "";
  if (!idSchema.safeParse(houseTypeId).success)
    return NextResponse.json({ message: "รหัสแบบบ้านไม่ถูกต้อง" }, { status: 400 });
  if (!(await canAccessRecord(user, "house-types", houseTypeId)))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการแบบบ้านนี้" }, { status: 403 });
  const row = await prisma.siteContent.findUnique({ where: { content_key: houseFloorplanKey(houseTypeId) } });
  return NextResponse.json({ data: readHouseFloorplan(JSON.parse(row?.body || "null")) });
}

export async function PUT(request: Request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
  const parsed = z
    .object({ houseTypeId: z.string().uuid(), data: houseFloorplanSchema })
    .safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ message: "ข้อมูล Floor Plan ไม่ถูกต้อง" }, { status: 400 });
  const { houseTypeId, data } = parsed.data;
  if (!(await canAccessRecord(user, "house-types", houseTypeId)))
    return NextResponse.json({ message: "ไม่มีสิทธิ์จัดการแบบบ้านนี้" }, { status: 403 });

  const mediaIds = data.items.map((item) => item.mediaId);
  const mediaCount = await prisma.mediaAsset.count({
    where: {
      id: { in: mediaIds },
      entity_type: "house-types",
      entity_id: houseTypeId,
      media_kind: "floorplan",
      mime_type: { startsWith: "image/" },
    },
  });
  if (mediaCount !== mediaIds.length || new Set(mediaIds).size !== mediaIds.length)
    return NextResponse.json({ message: "พบรูป Floor Plan ที่ไม่ถูกต้อง" }, { status: 400 });

  await prisma.siteContent.upsert({
    where: { content_key: houseFloorplanKey(houseTypeId) },
    create: { content_key: houseFloorplanKey(houseTypeId), title: "House Floor Plans", body: JSON.stringify(data) },
    update: { body: JSON.stringify(data) },
  });
  return NextResponse.json({ ok: true });
}
