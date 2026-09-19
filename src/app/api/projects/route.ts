import type { RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows] = await db().query<RowDataPacket[]>(`SELECT slug, name_th AS name, location,
    CASE property_type WHEN 'DETACHED_HOUSE' THEN 'บ้านเดี่ยว' WHEN 'TOWNHOME' THEN 'ทาวน์โฮม' WHEN 'SEMI_DETACHED' THEN 'บ้านแฝด' ELSE 'อาคารพาณิชย์' END AS type,
    CONCAT(FORMAT(starting_price / 1000000, 3), ' ล้านบาท*') AS price, starting_price AS startingPrice,
    CASE status WHEN 'READY' THEN 'พร้อมอยู่' ELSE 'กำลังก่อสร้าง' END AS status,
    'MIDA PROPERTY' AS label, COALESCE(description, '') AS description
    FROM projects WHERE status <> 'ARCHIVED' ORDER BY starting_price`);
  return NextResponse.json(rows);
}
