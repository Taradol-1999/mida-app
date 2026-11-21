import { constants } from "node:fs";
import { access, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const authSecret = process.env.AUTH_SECRET?.trim();
    if (process.env.NODE_ENV === "production" && (!authSecret || authSecret.length < 32)) {
      throw new Error("Invalid production authentication configuration");
    }
    const uploadsDirectory = path.resolve(
      process.env.UPLOADS_DIRECTORY || path.join(process.cwd(), "public", "uploads"),
    );
    await mkdir(uploadsDirectory, { recursive: true });
    await access(uploadsDirectory, constants.W_OK);
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", database: "connected", storage: "writable", timestamp: new Date().toISOString() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "unavailable", timestamp: new Date().toISOString() },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
