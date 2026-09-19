import { AdminSidebar } from "@/components/admin-sidebar";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <main className="min-h-screen bg-[#f5f7fa] md:flex"><AdminSidebar user={user} /><section className="min-w-0 flex-1 p-5 md:p-9">{children}</section></main>;
}
