import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3107";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const id = randomUUID();
let cookie = "";
async function main() {
  const user = await prisma.user.findFirstOrThrow({
    where: { role: "SUPER_ADMIN", is_active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  cookie = `mida_session=${await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production"))}`;
  await prisma.project.create({
    data: {
      id,
      slug: `logo-check-${id}`,
      name_th: "Temporary logo",
      location: "Test",
      property_type: "DETACHED_HOUSE",
    },
  });
  const endpoint = `${origin}/api/admin/media?entityType=projects&entityId=${id}&mediaKind=logo`;
  const before = await (await fetch(`${origin}/projects/logo-check-${id}`)).text();
  assert(before.includes("01-mida-property"));
  const bytes = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=",
    "base64",
  );
  for (let index = 0; index < 2; index++) {
    const form = new FormData();
    form.set("entityType", "projects");
    form.set("entityId", id);
    form.set("mediaKind", "logo");
    form.set("file", new Blob([bytes], { type: "image/png" }), `logo-${index}.png`);
    const response = await fetch(`${origin}/api/admin/media`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: form,
    });
    assert.equal(response.status, 200);
  }
  const listing = await fetch(`${endpoint}&list=1`, { headers: { Cookie: cookie } });
  const { rows } = await listing.json();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, "logo-1.png");
  assert.equal((await fetch(`${origin}${rows[0].url}`)).status, 200);
  const html = await (await fetch(`${origin}/projects/logo-check-${id}`)).text();
  assert(html.includes(rows[0].id));
  const removed = await fetch(`${endpoint}&mediaId=${rows[0].id}`, { method: "DELETE", headers: { Cookie: cookie } });
  assert.equal(removed.status, 200);
  const after = await (await fetch(`${origin}/projects/logo-check-${id}`)).text();
  assert(after.includes("01-mida-property") && !after.includes(rows[0].id));
  console.log("Project logo upload/replacement, edit reload, public rendering, deletion and MIDA fallback passed");
}
main().finally(async () => {
  const assets = await prisma.mediaAsset.findMany({
    where: { entity_type: "projects", entity_id: id, media_kind: "logo" },
  });
  for (const asset of assets) {
    const response = await fetch(
      `${origin}/api/admin/media?entityType=projects&entityId=${id}&mediaKind=logo&mediaId=${asset.id}`,
      { method: "DELETE", headers: { Cookie: cookie } },
    );
    assert.equal(response.status, 200);
  }
  await prisma.activityLog.deleteMany({ where: { project_id: id } });
  await prisma.project.deleteMany({ where: { id } });
  await prisma.$disconnect();
});
