import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "mida_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "development-secret-change-me-before-production");

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER";
export type SessionUser = { id: string; name: string; email: string; role: UserRole };

export async function createSession(user: SessionUser) {
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
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as UserRole,
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
