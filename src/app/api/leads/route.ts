import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

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
  await prisma.lead.create({
    data: {
      project_id: value.projectId ?? null,
      name: `${value.firstName} ${value.lastName}`.trim(),
      first_name: value.firstName,
      last_name: value.lastName,
      phone: value.phone,
      email: value.email,
      family_members: value.familyMembers,
      province: value.province,
      district: value.district,
      subdistrict: value.subdistrict,
      residence_type: value.residenceType,
      budget: value.budget,
      preferred_contact_date: new Date(`${value.preferredContactDate}T00:00:00.000Z`),
      preferred_contact_time: new Date(`1970-01-01T${value.preferredContactTime}:00.000Z`),
      consent_news: value.consentNews ?? false,
      consent_contact: value.consentContact ?? false,
    },
  });
  return NextResponse.json({ ok: true }, { status: 201 });
}
