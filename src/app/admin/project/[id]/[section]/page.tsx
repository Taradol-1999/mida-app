import { notFound, redirect } from "next/navigation";
import { ProjectEditor } from "@/components/project-editor";
import { ProjectWorkspace } from "@/components/project-workspace";
import { requireUser } from "@/lib/auth";
import { canAccessProject } from "@/lib/project-access";
import { prisma } from "@/lib/prisma";

const sections = [
  "dashboard",
  "project-info",
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
  const user = await requireUser();
  const { id, section } = await params;
  if (!canAccessProject(user, id)) notFound();
  if (!sections.includes(section as Section)) notFound();
  const project = await prisma.project.findUnique({ where: { id }, select: { name_th: true } });
  if (!project) notFound();
  if (section === "homepage") redirect(`/admin/project/${id}/project-info`);
  if (section === "project-info") return <ProjectEditor selectedProjectId={id} mode="edit" />;
  return (
    <ProjectWorkspace
      projectId={id}
      projectName={project.name_th}
      section={section as Exclude<Section, "project-info">}
    />
  );
}
