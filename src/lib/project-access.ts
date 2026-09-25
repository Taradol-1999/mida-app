import type { SessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export function canAccessProject(user: SessionUser, projectId: string | null | undefined) {
  return user.role === "SUPER_ADMIN" || Boolean(projectId && user.projectIds.includes(projectId));
}

export function projectScope(user: SessionUser) {
  return user.role === "SUPER_ADMIN" ? {} : { id: { in: user.projectIds } };
}

export function projectContentScope(user: SessionUser) {
  return user.role === "SUPER_ADMIN" ? {} : { project_id: { in: user.projectIds } };
}

// Resolve ownership from the stored record, never from a submitted project ID.
export async function canAccessRecord(user: SessionUser, resource: string, id: string) {
  if (user.role === "SUPER_ADMIN") return true;
  if (resource === "projects") return canAccessProject(user, id);
  const query = { where: { id }, select: { project_id: true } } as const;
  const record =
    resource === "house-types"
      ? await prisma.houseType.findUnique(query)
      : resource === "facilities"
        ? await prisma.facility.findUnique(query)
        : resource === "promotions"
          ? await prisma.promotion.findUnique(query)
          : resource === "news"
            ? await prisma.newsItem.findUnique(query)
            : resource === "leads"
              ? await prisma.lead.findUnique(query)
              : null;
  return Boolean(record && canAccessProject(user, record.project_id));
}
