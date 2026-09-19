"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const projectItems = [
  ["/admin/projects", "โครงการทั้งหมด", "⌂"],
  ["/admin/house-types", "จัดการแบบบ้าน", "▦"],
  ["/admin/facilities", "สิ่งอำนวยความสะดวก", "✦"],
  ["/admin/promotions", "โปรโมชั่น / แคมเปญ", "◇"],
  ["/admin/news", "ข่าวสารและกิจกรรม", "▤"],
  ["/admin/content", "ข้อมูลหน้าหลักและติดต่อ", "⌁"],
  ["/admin/leads", "รายชื่อผู้ลงทะเบียน", "●"],
] as const;

function initials(name: string) { return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AD"; }

export function AdminSidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const projectOpen = projectItems.some(([href]) => pathname === href);
  const linkClass = (href: string) => `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${pathname === href ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/30" : "text-indigo-200 hover:bg-indigo-900/60 hover:text-white"}`;
  return <aside className="flex w-full shrink-0 flex-col bg-[#1e1b4b] text-white md:min-h-screen md:w-72"><div className="border-b border-indigo-950/40 bg-[#110e3b] p-5"><Link href="/admin" className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-indigo-500 text-sm font-extrabold shadow-md">{initials(user.name)}</span><span><span className="block text-sm font-semibold">{user.name}</span><span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-indigo-300"><i className="size-2 rounded-full bg-emerald-400" />{user.role === "SUPER_ADMIN" ? "Super Admin" : "ผู้ดูแลระบบ"}</span></span></Link></div><div className="flex-1 overflow-y-auto p-4"><p className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-indigo-400">WORKSPACE</p><nav className="space-y-1"><Link href="/admin" className={linkClass("/admin")}><span className="text-base">◔</span>Dashboard MD <span className="ml-auto text-[10px] opacity-70">ภาพรวม</span></Link>{user.role === "SUPER_ADMIN" && <Link href="/admin/users" className={linkClass("/admin/users")}><span className="text-base">♙</span>จัดการผู้ใช้งาน</Link>}<details open={projectOpen} className="group mt-3"><summary className="flex cursor-pointer list-none items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold text-indigo-100 hover:bg-indigo-900/60"><span className="flex items-center gap-3"><span className="text-base text-indigo-300">▣</span>MIDA Property</span><span className="text-xs transition group-open:rotate-180">⌄</span></summary><div className="ml-4 mt-1 space-y-0.5 border-l border-indigo-800/70 py-1 pl-3">{projectItems.map(([href, label, icon]) => <Link key={href} href={href} className={linkClass(href)}><span className={`text-xs ${href === "/admin/leads" ? "text-emerald-300" : "text-indigo-300"}`}>{icon}</span>{label}</Link>)}</div></details></nav></div><div className="border-t border-indigo-950/40 bg-[#110e3b]/65 p-4"><p className="mb-3 px-1 text-xs text-indigo-300">MIDA Data Management</p><LogoutButton /></div></aside>;
}
