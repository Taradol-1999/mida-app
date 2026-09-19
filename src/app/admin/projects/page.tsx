import { ProjectEditor } from "@/components/project-editor";
import { requireUser } from "@/lib/auth";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ project?: string }> }) {
  await requireUser();
  const { project } = await searchParams;
  return <ProjectEditor selectedProjectId={project} />;
}
