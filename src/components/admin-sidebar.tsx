import Link from "next/link";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

const items = [
  ["/admin", "Dashboard MD"], ["/admin/projects", "โครงการ"], ["/admin/house-types", "แบบบ้าน"], ["/admin/facilities", "สิ่งอำนวยความสะดวก"], ["/admin/promotions", "โปรโมชั่น"], ["/admin/news", "ข่าวสารและกิจกรรม"], ["/admin/leads", "ผู้ลงทะเบียน"], ["/admin/content", "เนื้อหาเว็บไซต์"],
];

export function AdminSidebar({ user }: { user: SessionUser }) {
  return <aside className="flex w-full shrink-0 flex-col bg-[#001B3D] px-5 py-6 text-white md:min-h-screen md:w-72"><Link href="/admin" className="mb-9 flex items-center gap-2 font-extrabold"><span className="grid size-9 place-items-center rounded bg-[#F5A623] text-[#001B3D]">M</span>MIDA ADMIN</Link><nav className="space-y-1 text-sm">{items.map(([href, label]) => <Link key={href} href={href} className="block rounded-lg px-3 py-2.5 text-slate-200 hover:bg-white/10 hover:text-white">{label}</Link>)}{user.role === "SUPER_ADMIN" && <Link href="/admin/users" className="block rounded-lg px-3 py-2.5 text-slate-200 hover:bg-white/10 hover:text-white">ผู้ใช้งานและสิทธิ์</Link>}</nav><div className="mt-auto pt-8"><p className="text-sm font-bold">{user.name}</p><p className="mb-3 mt-1 text-xs text-slate-400">{user.role}</p><LogoutButton /></div></aside>;
}
