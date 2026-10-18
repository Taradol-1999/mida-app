import { redirect } from "next/navigation";
import { MidaLivingManager } from "@/components/mida-living-manager";
import { requireUser } from "@/lib/auth";

export default async function MidaBlogAdminPage() {
  const user = await requireUser();
  if (user.role !== "SUPER_ADMIN") redirect("/admin");
  return <MidaLivingManager blog />;
}
