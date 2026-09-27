import { NextResponse } from "next/server";
import { recordAdminActivity } from "@/lib/admin-activity";
import { clearSession, getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const user = await getSession();
  if (user) await recordAdminActivity({ request, user, action: "LOGOUT", detail: "ออกจากระบบหลังบ้าน" });
  await clearSession();
  return NextResponse.json({ ok: true });
}
