import { AdminMediaManager } from "@/components/admin-media-manager";
import { requireUser } from "@/lib/auth";

export default async function AdminMediaPage() {
  await requireUser();
  return <AdminMediaManager />;
}
