import { ProjectEditor } from "@/components/project-editor";
import { requireUser } from "@/lib/auth";

export default async function ProjectsPage() {
  await requireUser();
  return <ProjectEditor mode="create" />;
}
