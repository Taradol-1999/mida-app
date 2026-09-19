import { AdminSidebar } from "@/components/admin-sidebar";
import { requireUser } from "@/lib/auth";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  return <main className="min-h-screen bg-slate-50 md:flex"><AdminSidebar user={user} /><section className="min-w-0 flex-1"><div className="min-h-17 border-b border-slate-200 bg-white px-5 py-3 shadow-sm md:px-8"><div className="mx-auto flex max-w-[1600px] items-center justify-between"><p className="text-xs font-semibold tracking-wide text-slate-400">MIDA PROPERTY · DATA MANAGEMENT SYSTEM</p><p className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">{new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })}</p></div></div><div className="mx-auto w-full max-w-[1600px] p-5 md:p-8">{children}</div></section></main>;
}
