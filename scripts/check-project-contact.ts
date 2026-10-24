import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";
import { projectContactKey } from "../src/lib/project-contact";
import { contactOptionsKey, defaultWidgetChannels } from "../src/lib/contact-widget-options";

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
    tiktok: "https://www.tiktok.com/@test-project",
    youtube: "https://www.youtube.com/@test-project",
    widgetChannels: { ...defaultWidgetChannels },
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
  assert(html.includes(contact.tiktok));
  assert(html.includes('aria-label="YouTube"'));
  const invalid = await fetch(`${origin}/api/admin/project-contact`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: id, contact: { ...contact, tiktok: "javascript:alert(1)" } }),
  });
  assert.equal(invalid.status, 400);
  const legacy = { line: contact.line, messenger: contact.messenger, phone: contact.phone, email: contact.email };
  assert.equal(
    (
      await fetch(`${origin}/api/admin/project-contact`, {
        method: "PUT",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, contact: legacy }),
      })
    ).status,
    200,
  );
  assert.equal(
    (await (await fetch(`${origin}/api/admin/project-contact?projectId=${id}`, { headers: { Cookie: cookie } })).json())
      .tiktok,
    contact.tiktok,
  );
  assert.equal((await fetch(`${origin}/api/admin/project-contact?projectId=${id}`)).status, 401);
  const toggle = await fetch(`${origin}/api/admin/project-contact`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      projectId: id,
      contact: { ...contact, widgetChannels: { ...defaultWidgetChannels, tiktok: false, youtube: false } },
    }),
  });
  assert.equal(toggle.status, 200);
  const toggled = await (
    await fetch(`${origin}/api/admin/project-contact?projectId=${id}`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(toggled.youtube, contact.youtube);
  assert.equal(toggled.tiktok, contact.tiktok);
  assert.equal(toggled.widgetChannels.youtube, false);
  const toggledHtml = await (await fetch(`${origin}/projects/contact-check-${id}`)).text();
  assert(!toggledHtml.includes('aria-label="TikTok"'));
  assert(!toggledHtml.includes('aria-label="YouTube"'));
  assert(toggledHtml.includes('aria-label="LINE"'));
  const invalidFlag = await fetch(`${origin}/api/admin/project-contact`, {
    method: "PUT",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ projectId: id, contact: { ...contact, widgetChannels: { youtube: "false" } } }),
  });
  assert.equal(invalidFlag.status, 400);
  assert.equal(
    (
      await fetch(`${origin}/api/admin/project-contact`, {
        method: "PUT",
        headers: { Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: id, contact: { ...contact, tiktok: "" } }),
      })
    ).status,
    200,
  );
  const cleared = await (
    await fetch(`${origin}/api/admin/project-contact?projectId=${id}`, { headers: { Cookie: cookie } })
  ).json();
  assert.equal(cleared.tiktok, "");
  assert.equal(cleared.messenger, contact.messenger);
  const hiddenHtml = await (await fetch(`${origin}/projects/contact-check-${id}`)).text();
  assert(!hiddenHtml.includes('aria-label="TikTok"'));
  const central = await fetch(`${origin}/api/admin/contact-widget`, { headers: { Cookie: cookie } });
  assert.equal(central.status, 200);
  const centralData = await central.json();
  assert.equal(typeof centralData.tiktok, "string");
  assert.equal(typeof centralData.youtube, "string");
  assert.equal(typeof centralData.widgetChannels.youtube, "boolean");
  console.log("Project contact save/reload, unchanged settings, public widget and authentication passed");
}
main().finally(async () => {
  await prisma.siteContent.deleteMany({
    where: { content_key: { in: [projectContactKey(id), contactOptionsKey(id)] } },
  });
  await prisma.activityLog.deleteMany({ where: { project_id: id } });
  await prisma.project.deleteMany({ where: { id } });
  await prisma.$disconnect();
});
