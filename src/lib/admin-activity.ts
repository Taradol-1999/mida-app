import type { SessionUser } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";
import { getClientIp } from "@/lib/client-ip";
import { prisma } from "@/lib/prisma";

type AdminActivity = {
  request: Request;
  user: SessionUser;
  action: string;
  detail: string;
  projectId?: string | null;
  oldPayload?: Prisma.InputJsonValue | null;
  newPayload?: Prisma.InputJsonValue | null;
};

/** Writes an audit record without allowing an audit failure to block a completed admin action. */
export async function recordAdminActivity({
  request,
  user,
  action,
  detail,
  projectId = null,
  oldPayload = null,
  newPayload = null,
}: AdminActivity) {
  try {
    await prisma.activityLog.create({
      data: {
        area: "ADMIN",
        action,
        path: new URL(request.url).pathname,
        user_id: user.id,
        project_id: projectId,
        ip_address: getClientIp(request),
        detail: detail.slice(0, 255),
        old_payload: oldPayload ?? undefined,
        new_payload: newPayload ?? undefined,
      },
    });
  } catch (error) {
    console.error("Unable to write admin activity log", error);
  }
}
