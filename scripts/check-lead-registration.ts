import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "./prisma";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3107";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const id = randomUUID();
async function main() {
  await prisma.project.create({
    data: {
      id,
      slug: `lead-check-${id}`,
      name_th: "Temporary registration",
      location: "Test",
      property_type: "DETACHED_HOUSE",
    },
  });
  const body = {
    projectId: id,
    firstName: "Test",
    lastName: "Registration",
    phone: "0000000000",
    email: `${id}@example.invalid`,
    familyMembers: 2,
    ageRange: "26 - 30",
    occupation: "พนักงานเอกชน",
    province: "Test",
    district: "Test",
    subdistrict: "Test",
    residenceType: "HOUSE",
    budget: "2-3 ล้านบาท",
    preferredContactDate: "2026-12-01",
    preferredContactTime: "10:00",
    consentContact: true,
  };
  const response = await fetch(`${origin}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  assert.equal(response.status, 201, await response.text());
  const lead = await prisma.lead.findFirstOrThrow({ where: { project_id: id } });
  assert.equal(lead.age_range, body.ageRange);
  assert.equal(lead.occupation, body.occupation);
  const invalid = await fetch(`${origin}/api/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, occupation: "invalid-option" }),
  });
  assert.equal(invalid.status, 400);
  const page = await (await fetch(`${origin}/projects/lead-check-${id}`)).text();
  assert(page.includes('name="ageRange"') && page.includes('name="occupation"') && page.includes('name="firstName"'));
  console.log("Inline registration renders; age and occupation save/reload and validation passed");
}
main().finally(async () => {
  await prisma.lead.deleteMany({ where: { project_id: id } });
  await prisma.activityLog.deleteMany({ where: { project_id: id } });
  await prisma.project.deleteMany({ where: { id } });
  await prisma.$disconnect();
});
