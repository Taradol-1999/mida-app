// Run against a local server: tsx --env-file=.env.local scripts/check-project-access.ts
// Creates isolated fixtures, then removes only those fixtures in finally.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { SignJWT } from "jose";
import { prisma } from "./prisma";

const origin = process.env.TEST_ORIGIN ?? "http://localhost:3000";
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname), "Use a local test server");
const projectIds = [randomUUID(), randomUUID(), randomUUID()];
const userEmail = `project-access-${randomUUID()}@example.invalid`;
let userId = "";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production");

async function cookie(user: { id: string; name: string; email: string; role: string }) {
  return `mida_session=${await new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setExpirationTime("10m").sign(secret)}`;
}

async function main() {
  const admin = await prisma.user.findFirstOrThrow({
    where: { role: "SUPER_ADMIN", is_active: true },
    select: { id: true, name: true, email: true, role: true },
  });
  const adminCookie = await cookie(admin);
  async function request(session: string, path: string, expected: number, method = "GET", body?: unknown) {
    const response = await fetch(`${origin}${path}`, {
      method,
      redirect: "manual",
      headers: { Cookie: session, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    assert.equal(
      response.status,
      expected,
      `${method} ${path}: ${await response
        .clone()
        .text()
        .then((text) => text.slice(0, 160))}`,
    );
    return response;
  }
  const fixtures: Record<string, string[]> = {
    projects: projectIds,
    "house-types": [],
    facilities: [],
    promotions: [],
    news: [],
    leads: [],
  };
  for (const id of projectIds) {
    await prisma.project.create({
      data: {
        id,
        slug: `access-test-${id}`,
        name_th: `Access test ${id}`,
        location: "Test",
        property_type: "DETACHED_HOUSE",
      },
    });
    fixtures["house-types"].push(
      (await prisma.houseType.create({ data: { project_id: id, name: "Access test house" } })).id,
    );
    fixtures.facilities.push(
      (await prisma.facility.create({ data: { project_id: id, name: "Access test facility" } })).id,
    );
    fixtures.promotions.push(
      (await prisma.promotion.create({ data: { project_id: id, title: "Access test promotion" } })).id,
    );
    fixtures.news.push((await prisma.newsItem.create({ data: { project_id: id, title: "Access test news" } })).id);
    fixtures.leads.push(
      (await prisma.lead.create({ data: { project_id: id, name: `access-lead-${id}`, phone: "0000000000" } })).id,
    );
  }
  const userData = {
    name: "Temporary access test",
    email: userEmail,
    password: randomUUID(),
    role: "MARKETING",
    is_active: true,
    project_ids: projectIds.slice(0, 2),
  };
  await request(adminCookie, "/api/admin/users", 400, "POST", { ...userData, project_ids: [] });
  await request(adminCookie, "/api/admin/users", 400, "POST", { ...userData, project_ids: [randomUUID()] });
  const created = await (await request(adminCookie, "/api/admin/users", 201, "POST", userData)).json();
  userId = created.id;
  const marketingCookie = await cookie({ id: userId, name: userData.name, email: userEmail, role: "MARKETING" });
  const listed = await (await request(adminCookie, "/api/admin/users", 200)).json();
  assert.equal(listed.rows.find((row: { id: string }) => row.id === userId).projects.length, 2);
  for (const [resource, ids] of Object.entries(fixtures)) {
    const rows = (await (await request(marketingCookie, `/api/admin/${resource}`, 200)).json()).rows;
    assert.equal(rows.length, 2, `${resource} scoped list`);
    assert(rows.every((row: { id: string }) => ids.slice(0, 2).includes(row.id)));
    await request(marketingCookie, `/api/admin/${resource}`, 403, "PATCH", {
      id: ids[2],
      name: "Forbidden",
      project_id: projectIds[0],
    });
    await request(marketingCookie, `/api/admin/${resource}`, 403, "DELETE", { id: ids[2] });
    if (resource !== "projects")
      await request(marketingCookie, `/api/admin/${resource}`, 403, "PATCH", { id: ids[0], project_id: projectIds[2] });
  }
  for (const resource of ["house-types", "facilities", "promotions", "news"]) {
    await request(marketingCookie, `/api/admin/${resource}`, 403, "POST", { project_id: projectIds[2] });
    await request(marketingCookie, `/api/admin/${resource}`, 403, "POST", {});
  }
  await request(marketingCookie, "/api/admin/projects", 403, "POST", {});
  for (const resource of ["users", "content"]) await request(marketingCookie, `/api/admin/${resource}`, 403);
  await request(marketingCookie, `/api/admin/project-settings?projectId=${projectIds[2]}`, 403);
  await request(marketingCookie, "/api/admin/project-settings", 403, "PUT", {
    project_id: projectIds[2],
    phone: "0000",
  });
  await request(marketingCookie, "/api/admin/project-settings", 200, "PUT", {
    project_id: projectIds[0],
    phone: "123",
  });
  const settings = await (
    await request(marketingCookie, `/api/admin/project-settings?projectId=${projectIds[0]}`, 200)
  ).json();
  assert.equal(settings.settings.phone, "123");
  const house = await (
    await request(marketingCookie, "/api/admin/house-types", 201, "POST", {
      project_id: projectIds[0],
      name: "Created by assigned marketing",
    })
  ).json();
  await request(marketingCookie, "/api/admin/house-types", 200, "DELETE", { id: house.id });
  const csv = await (await request(marketingCookie, "/api/admin/leads?format=csv", 200)).text();
  assert(csv.includes(`access-lead-${projectIds[0]}`));
  assert(!csv.includes(`access-lead-${projectIds[2]}`));
  for (const [entityType, id] of [
    ["projects", projectIds[2]],
    ["house-types", fixtures["house-types"][2]],
    ["promotions", fixtures.promotions[2]],
    ["news", fixtures.news[2]],
  ]) {
    const url = `/api/admin/media?entityType=${entityType}&entityId=${id}&mediaKind=hero`;
    await request(marketingCookie, `${url}&list=1`, 403);
    await request(marketingCookie, `${url}&mediaId=${randomUUID()}`, 403, "DELETE");
    const body = new FormData();
    body.set("entityType", entityType);
    body.set("entityId", id);
    body.set("mediaKind", "hero");
    body.set("file", new Blob(["invalid upload"], { type: "text/plain" }), "test.txt");
    const upload = await fetch(`${origin}/api/admin/media`, {
      method: "POST",
      headers: { Cookie: marketingCookie },
      body,
    });
    assert.equal(upload.status, 403, "Cross-project upload denied before processing file");
  }
  await request(marketingCookie, `/admin/project/${projectIds[2]}/project-info`, 404);
  await request(marketingCookie, `/admin/project/${projectIds[0]}/project-info`, 200);
  const adminProjects = await (await request(adminCookie, "/api/admin/projects", 200)).json();
  assert(projectIds.every((id) => adminProjects.rows.some((row: { id: string }) => row.id === id)));
  await request(adminCookie, "/api/admin/users", 200, "PATCH", {
    ...userData,
    id: userId,
    password: "",
    project_ids: [projectIds[1]],
  });
  await request(marketingCookie, `/api/admin/project-settings?projectId=${projectIds[0]}`, 403);
  const remaining = await (await request(marketingCookie, "/api/admin/projects", 200)).json();
  assert.deepEqual(
    remaining.rows.map((row: { id: string }) => row.id),
    [projectIds[1]],
  );
  await prisma.userProject.deleteMany({ where: { user_id: userId } });
  assert.equal((await (await request(marketingCookie, "/api/admin/projects", 200)).json()).rows.length, 0);
  await request(marketingCookie, "/admin", 200);
  console.log(
    "PASS: assignment create/reload, scoped lists/CSV, authorized writes, cross-project CRUD/settings/media/page denial, Super Admin visibility, immediate revocation, no-project access.",
  );
}

main()
  .finally(async () => {
    await prisma.user.deleteMany({ where: { email: userEmail } });
    await prisma.lead.deleteMany({ where: { project_id: { in: projectIds } } });
    await prisma.promotion.deleteMany({ where: { project_id: { in: projectIds } } });
    await prisma.newsItem.deleteMany({ where: { project_id: { in: projectIds } } });
    await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    await prisma.$disconnect();
    console.log("Temporary test fixtures removed.");
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
