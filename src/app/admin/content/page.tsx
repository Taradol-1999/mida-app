import { MidaFrontendManager } from "@/components/mida-frontend-manager";
import { requireUser } from "@/lib/auth";

export default async function MidaFrontendPage() {
  await requireUser();
  return <MidaFrontendManager />;
}
