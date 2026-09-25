import { notFound, redirect } from "next/navigation";
import { AdminResourceManager } from "@/components/admin-resource";
import { adminResources, type AdminResource } from "@/lib/admin-resources";
import { requireUser } from "@/lib/auth";

export default async function AdminResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!adminResources.includes(resource as AdminResource)) notFound();
  const user = await requireUser();
  if ((resource === "users" || resource === "content") && user.role !== "SUPER_ADMIN") redirect("/admin");
  return <AdminResourceManager resource={resource as AdminResource} />;
}
