import { ProjectEditor } from "@/components/project-editor";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/admin");
  return <ProjectEditor mode="create" />;
}
