import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";
import { projectContactKey } from "../src/lib/project-contact";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3107";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
const id = randomUUID();
async function main() {
  const user = await prisma.user.findFirstOrThrow({
    where: { role: "SUPER_ADMIN", is_active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  const cookie = `mida_session=${await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("5m")
    .sign(new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production"))}`;
  await prisma.project.create({
    data: {
      id,
      slug: `contact-check-${id}`,
      name_th: "Temporary contact",
      location: "Test",
      property_type: "DETACHED_HOUSE",
    },
  });
  await prisma.projectSetting.create({
    data: { project_id: id, hero_title_th: "Preserve hero", map_url: "https://www.google.com/maps?q=13,100" },
  });
  const contact = {
    line: "https://line.me/test-project",
    messenger: "https://m.me/test-project",
    phone: "020000000",
    email: "test@example.invalid",
  };
  const save = await fetch(`${origin}/api/admin/project-contact`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: id, contact }),
  });
  assert.equal(save.status, 200, await save.text());
  const reload = await fetch(`${origin}/api/admin/project-contact?projectId=${id}`, { headers: { Cookie: cookie } });
  assert.deepEqual(await reload.json(), contact);
  const settings = await prisma.projectSetting.findUniqueOrThrow({ where: { project_id: id } });
  assert.equal(settings.hero_title_th, "Preserve hero");
  assert.equal(settings.map_url, "https://www.google.com/maps?q=13,100");
  const html = await (await fetch(`${origin}/projects/contact-check-${id}`)).text();
  assert(html.includes(contact.line) && html.includes(contact.messenger));
  assert.equal((await fetch(`${origin}/api/admin/project-contact?projectId=${id}`)).status, 401);
  console.log("Project contact save/reload, unchanged settings, public widget and authentication passed");
}
main().finally(async () => {
  await prisma.siteContent.deleteMany({ where: { content_key: projectContactKey(id) } });
  await prisma.activityLog.deleteMany({ where: { project_id: id } });
  await prisma.project.deleteMany({ where: { id } });
  await prisma.$disconnect();
});
