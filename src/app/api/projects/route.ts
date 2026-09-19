import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows] = await db().query<RowDataPacket[]>(`SELECT p.id, p.slug, p.name_th AS name, p.location,
    CASE property_type WHEN 'DETACHED_HOUSE' THEN 'บ้านเดี่ยว' WHEN 'TOWNHOME' THEN 'ทาวน์โฮม' WHEN 'SEMI_DETACHED' THEN 'บ้านแฝด' ELSE 'อาคารพาณิชย์' END AS type,
    CONCAT(FORMAT(starting_price / 1000000, 3), ' ล้านบาท*') AS price, starting_price AS startingPrice,
    CASE status WHEN 'READY' THEN 'พร้อมอยู่' ELSE 'กำลังก่อสร้าง' END AS status,
    'MIDA PROPERTY' AS label, p.is_featured, p.is_new, COALESCE(p.tags, JSON_ARRAY()) AS tags, COALESCE(p.description, '') AS description,
    EXISTS(SELECT 1 FROM media_assets m WHERE m.entity_type='projects' AND m.entity_id=p.id AND m.media_kind='cover') AS has_cover
    FROM projects p WHERE p.status <> 'ARCHIVED' ORDER BY p.starting_price`);
  return NextResponse.json(rows);
}
