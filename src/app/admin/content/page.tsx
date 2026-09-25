import { MidaFrontendManager } from "@/components/mida-frontend-manager";
import { requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function MidaFrontendPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/admin");
  return <MidaFrontendManager />;
}
