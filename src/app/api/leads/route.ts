import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const leadSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(8).max(30),
  email: z.string().email().optional().or(z.literal("")),
  budget: z.string().max(80).optional(),
  projectId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณาตรวจสอบข้อมูลที่กรอก" }, { status: 400 });
  const value = parsed.data;
  await db().execute("INSERT INTO leads (id, project_id, name, phone, email, budget) VALUES (UUID(), ?, ?, ?, ?, ?)", [
    value.projectId ?? null,
    value.name,
    value.phone,
    value.email || null,
    value.budget ?? null,
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
