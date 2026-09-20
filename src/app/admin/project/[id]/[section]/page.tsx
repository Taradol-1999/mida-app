import type { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import { ProjectWorkspace } from "@/components/project-workspace";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";

const sections = [
  "dashboard",
  "homepage",
  "house-types",
  "facilities",
  "promotions",
  "news",
  "contact",
  "after-sales",
  "leads",
] as const;
type Section = (typeof sections)[number];

export default async function ProjectSectionPage({ params }: { params: Promise<{ id: string; section: string }> }) {
  await requireUser();
  const { id, section } = await params;
  if (!sections.includes(section as Section)) notFound();
  const [rows] = await db().execute<RowDataPacket[]>("SELECT name_th FROM projects WHERE id=? LIMIT 1", [id]);
  if (!rows[0]) notFound();
  return <ProjectWorkspace projectId={id} projectName={String(rows[0].name_th)} section={section as Section} />;
}
