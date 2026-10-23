import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3107";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const projectId = randomUUID();
const facilityId = randomUUID();
let cookie = "";
async function main() {
  const admin = await prisma.user.findFirstOrThrow({
    where: { role: "SUPER_ADMIN", is_active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  cookie = `mida_session=${await new SignJWT(admin)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production"))}`;
  await prisma.project.create({
    data: {
      id: projectId,
      slug: `facility-check-${projectId}`,
      name_th: "Facility media check",
      location: "Test",
      property_type: "DETACHED_HOUSE",
    },
  });
  await prisma.facility.create({
    data: { id: facilityId, project_id: projectId, name: "Temporary pool", name_en: "Test pool" },
  });
  for (let index = 0; index < 2; index++) {
    const form = new FormData();
    form.set("entityType", "facilities");
    form.set("entityId", facilityId);
    form.set("mediaKind", "gallery");
    const bytes = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=",
      "base64",
    );
    form.set("file", new Blob([bytes], { type: "image/png" }), `check-${index}.png`);
    const response = await fetch(`${origin}/api/admin/media`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: form,
    });
    assert.equal(response.status, 200, await response.text());
  }
  const base = `${origin}/api/admin/media?entityType=facilities&entityId=${facilityId}&mediaKind=gallery`;
  const listed = await fetch(`${base}&list=1`, { headers: { Cookie: cookie } });
  assert.equal(listed.status, 200);
  const { rows } = await listed.json();
  assert.equal(rows.length, 2);
  for (const row of rows) assert.equal((await fetch(`${origin}${row.url}`)).status, 200);
  assert.equal((await fetch(`${base}&list=1`)).status, 401);
  const page = await fetch(`${origin}/projects/facility-check-${projectId}`);
  assert.equal(page.status, 200);
  const html = await page.text();
  assert(html.includes("Temporary pool") && html.includes(facilityId));
  const removed = await fetch(`${origin}/api/admin/facilities`, { method: "DELETE", headers: { Cookie: cookie, "Content-Type": "application/json" }, body: JSON.stringify({ id: facilityId }) });
  assert.equal(removed.status, 200);
  assert.equal(await prisma.facility.count({ where: { id: facilityId } }), 0);
  assert.equal(await prisma.mediaAsset.count({ where: { entity_type: "facilities", entity_id: facilityId } }), 0);
  assert.equal((await fetch(`${origin}${rows[0].url}`)).status, 404);
  console.log("Facility upload, reload, public page, private listing and deletion passed");
}
main().finally(async () => {
  const media = await prisma.mediaAsset.findMany({ where: { entity_type: "facilities", entity_id: facilityId } });
  for (const row of media) {
    const response = await fetch(
      `${origin}/api/admin/media?entityType=facilities&entityId=${facilityId}&mediaKind=gallery&mediaId=${row.id}`,
      { method: "DELETE", headers: { Cookie: cookie } },
    );
    assert.equal(response.status, 200, "Remove temporary upload");
  }
  await prisma.activityLog.deleteMany({ where: { project_id: projectId } });
  await prisma.facility.deleteMany({ where: { id: facilityId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.$disconnect();
});
