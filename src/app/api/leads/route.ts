import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const leadSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  phone: z.string().min(8).max(30),
  email: z.string().email(),
  familyMembers: z.coerce.number().int().min(1).max(99),
  province: z.string().min(1).max(120),
  district: z.string().min(1).max(120),
  subdistrict: z.string().min(1).max(120),
  residenceType: z.enum(["HOUSE", "CONDO", "DORMITORY"]),
  budget: z.string().min(1).max(80),
  preferredContactDate: z.string().date(),
  preferredContactTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  consentNews: z.coerce.boolean().optional(),
  consentContact: z.coerce.boolean().optional(),
  projectId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const parsed = leadSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "กรุณาตรวจสอบข้อมูลที่กรอก" }, { status: 400 });
  const value = parsed.data;
  await db().execute(
    `INSERT INTO leads
     (id, project_id, name, first_name, last_name, phone, email, family_members, province, district, subdistrict,
      residence_type, budget, preferred_contact_date, preferred_contact_time, consent_news, consent_contact)
     VALUES (UUID(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      value.projectId ?? null,
      `${value.firstName} ${value.lastName}`.trim(),
      value.firstName,
      value.lastName,
      value.phone,
      value.email,
      value.familyMembers,
      value.province,
      value.district,
      value.subdistrict,
      value.residenceType,
      value.budget,
      value.preferredContactDate,
      value.preferredContactTime,
      value.consentNews ?? false,
      value.consentContact ?? false,
    ],
  );
  return NextResponse.json({ ok: true }, { status: 201 });
}
