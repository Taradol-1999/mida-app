import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";
import { leadAgeRanges, leadOccupations } from "@/lib/lead-options";

const leadSchema = z
  .object({
    firstName: z.string().trim().min(1).max(80),
    lastName: z.string().trim().min(1).max(80),
    phone: z.string().trim().min(8).max(30),
    email: z.string().email().optional(),
    familyMembers: z.coerce.number().int().min(1).max(99).optional(),
    ageRange: z.enum(leadAgeRanges).optional(),
    occupation: z.enum(leadOccupations),
    province: z.string().trim().min(1).max(120).optional(),
    district: z.string().trim().min(1).max(120).optional(),
    subdistrict: z.string().min(1).max(120).optional(),
    residenceType: z.enum(["HOUSE", "CONDO", "DORMITORY"]).optional(),
    budget: z.string().min(1).max(80).optional(),
    preferredContactDate: z.string().date().optional(),
    preferredContactTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .optional(),
    consentNews: z.coerce.boolean().optional(),
    consentContact: z.coerce.boolean().optional(),
    projectId: z.string().uuid().optional(),
  })
  .refine(({ firstName, lastName }) => Array.from(`${firstName} ${lastName}`).length <= 120);

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
      email: value.email ?? null,
      family_members: value.familyMembers ?? null,
      age_range: value.ageRange ?? null,
      occupation: value.occupation,
      province: value.province ?? null,
      district: value.district ?? null,
      subdistrict: value.subdistrict ?? null,
      residence_type: value.residenceType ?? null,
      budget: value.budget ?? null,
      preferred_contact_date: value.preferredContactDate
        ? new Date(`${value.preferredContactDate}T00:00:00.000Z`)
        : null,
      preferred_contact_time: value.preferredContactTime
        ? new Date(`1970-01-01T${value.preferredContactTime}:00.000Z`)
        : null,
      consent_news: value.consentNews ?? false,
      consent_contact: value.consentContact ?? false,
    },
  });
  try {
    await prisma.activityLog.create({
      data: {
        area: "PUBLIC",
        action: "LEAD_CREATE",
        path: new URL(request.url).pathname,
        project_id: value.projectId ?? null,
        ip_address: getClientIp(request),
        detail: "ลงทะเบียนรับข้อเสนอพิเศษ",
      },
    });
  } catch (error) {
    console.error("Unable to write lead activity log", error);
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
