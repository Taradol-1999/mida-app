import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { isUserRole, type UserRole } from "@/lib/user-roles";
export type { UserRole } from "@/lib/user-roles";

const cookieName = "mida_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production");

export type SessionUser = { id: string; name: string; email: string; role: UserRole; projectIds: string[] };

export async function createSession(user: Omit<SessionUser, "projectIds">) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secret);
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (!payload.id || !payload.email || !payload.role || !payload.name) return null;
    // Use current account permissions, including sessions created before a role change.
    const user = await prisma.user.findUnique({
      where: { id: String(payload.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        is_active: true,
        projects: { select: { project_id: true } },
      },
    });
    if (!user?.is_active || !isUserRole(user.role)) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      projectIds: user.projects.map((item) => item.project_id),
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getSession();
  if (!user) redirect("/login");
  return user;
}
