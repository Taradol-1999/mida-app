import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";
import { projectLocationKey } from "../src/lib/project-location";

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
      slug: `location-check-${id}`,
      name_th: "Temporary location",
      location: "Test",
      property_type: "DETACHED_HOUSE",
    },
  });
  const form = new FormData();
  form.set("entityType", "projects");
  form.set("entityId", id);
  form.set("mediaKind", "map-image");
  form.set(
    "file",
    new Blob(
      [
        Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFOsAAAAASUVORK5CYII=",
          "base64",
        ),
      ],
      { type: "image/png" },
    ),
    "test-map.png",
  );
  const uploaded = await fetch(`${origin}/api/admin/media`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  assert.equal(uploaded.status, 200);
  const { id: imageId } = await uploaded.json();
  const data = {
    mapUrl: "https://www.google.com/maps?q=13.75,100.5",
    imageId,
    places: [
      { name: "สถานที่ทดสอบ", nameEn: "Test place", url: "https://example.com/place-a", icon: "fa-hospital" },
      { name: "สถานที่สอง", url: "https://example.com/place-b" },
    ],
  };
  const saved = await fetch(`${origin}/api/admin/project-location`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: id, data }),
  });
  assert.equal(saved.status, 200, await saved.text());
  const reloaded = await fetch(`${origin}/api/admin/project-location?projectId=${id}`, { headers: { Cookie: cookie } });
  const result = await reloaded.json();
  assert.equal(result.data.imageId, imageId);
  assert.deepEqual(result.data.places, data.places);
  assert.equal((await fetch(`${origin}/api/admin/project-location?projectId=${id}`)).status, 401);
  const bad = await fetch(`${origin}/api/admin/project-location`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: id,
      data: { ...data, places: [{ name: "Unsafe", url: "javascript:alert(1)" }] },
    }),
  });
  assert.equal(bad.status, 400);
  const html = await (await fetch(`${origin}/projects/location-check-${id}`)).text();
  assert(html.includes(imageId) && html.includes("https://example.com/place-a") && html.includes("สถานที่ทดสอบ"));
  console.log("Location: upload, save/reload, public map/image/links, authentication and URL validation passed");
}
main().finally(async () => {
  const assets = await prisma.mediaAsset.findMany({
    where: { entity_type: "projects", entity_id: id, media_kind: "map-image" },
  });
  for (const asset of assets) {
    const response = await fetch(
      `${origin}/api/admin/media?entityType=projects&entityId=${id}&mediaKind=map-image&mediaId=${asset.id}`,
      { method: "DELETE", headers: { Cookie: cookie } },
    );
    assert.equal(response.status, 200);
  }
  await prisma.siteContent.deleteMany({ where: { content_key: projectLocationKey(id) } });
  await prisma.activityLog.deleteMany({ where: { project_id: id } });
  await prisma.project.deleteMany({ where: { id } });
  await prisma.$disconnect();
});
