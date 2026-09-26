import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const typeLabels = {
  DETACHED_HOUSE: "บ้านเดี่ยว",
  TOWNHOME: "ทาวน์โฮม",
  SEMI_DETACHED: "บ้านแฝด",
  COMMERCIAL: "อาคารพาณิชย์",
} as const;

export async function GET() {
  const projects = await prisma.project.findMany({
    where: { status: { not: "ARCHIVED" } },
    orderBy: { starting_price: "asc" },
  });
  const media = await prisma.mediaAsset.findMany({
    where: {
      entity_type: "projects",
      entity_id: { in: projects.map((project) => project.id) },
      media_kind: { in: ["cover", "brochure"] },
    },
    select: { entity_id: true, media_kind: true },
  });
  const mediaKeys = new Set(media.map((item) => `${item.entity_id}:${item.media_kind}`));
  return NextResponse.json(
    projects.map((project) => ({
      id: project.id,
      slug: project.slug,
      name: project.name_th,
      name_en: project.name_en,
      location: project.location,
      location_en: project.location_en,
      latitude: project.latitude === null ? null : Number(project.latitude),
      longitude: project.longitude === null ? null : Number(project.longitude),
      type: typeLabels[project.property_type],
      price: `${((Number(project.starting_price) || 0) / 1_000_000).toLocaleString("th-TH", { maximumFractionDigits: 3 })} ล้านบาท`,
      startingPrice: project.starting_price === null ? null : Number(project.starting_price),
      status: project.status === "READY" ? "พร้อมอยู่" : "กำลังก่อสร้าง",
      label: "MIDA PROPERTY",
      is_featured: project.is_featured,
      is_new: project.is_new,
      tags: Array.isArray(project.tags) ? project.tags : [],
      description: project.description ?? "",
      description_en: project.description_en,
      has_cover: mediaKeys.has(`${project.id}:cover`),
      has_brochure: mediaKeys.has(`${project.id}:brochure`),
    })),
  );
}
