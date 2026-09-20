"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

type ProjectNavigation = { id: string; name: string };
const projectMenus = [
  ["dashboard", "Dashboard HP", "fa-chart-line"],
  ["homepage", "จัดการข้อมูลหน้าหลัก", "fa-house-laptop"],
  ["house-types", "จัดการแบบบ้าน (House Types)", "fa-bed"],
  ["facilities", "จัดการสิ่งอำนวยความสะดวก", "fa-dumbbell"],
  ["promotions", "จัดการข้อมูลโปรโมชั่น", "fa-tags"],
  ["news", "จัดการข้อมูลข่าวสาร", "fa-newspaper"],
  ["contact", "จัดการข้อมูลติดต่อ & แผนที่", "fa-map-location-dot"],
  ["after-sales", "บริการหลังการขาย (Mida Care)", "fa-screwdriver-wrench"],
  ["leads", "รายชื่อผู้ลงทะเบียนรับสิทธิ์", "fa-id-card"],
] as const;

function initials(name: string) {
  return (
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AD"
  );
}

export function AdminSidebar({ user, projects }: { user: SessionUser; projects: ProjectNavigation[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const selectedProject = pathname.match(/^\/admin\/project\/([^/]+)\//)?.[1];
  const isCentral = !selectedProject;
  const menuClass = (href: string, accent = false) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${pathname === href ? "bg-indigo-600 text-white shadow-sm" : accent ? "text-emerald-300 hover:bg-indigo-900/50" : "text-indigo-200 hover:bg-indigo-900/50 hover:text-white"}`;
  const projectHref = (section: string) => `/admin/project/${selectedProject}/${section}`;
  const handleSelection = (value: string) =>
    router.push(value === "central" ? "/admin" : `/admin/project/${value}/dashboard`);

  return (
    <aside className="flex w-full shrink-0 flex-col bg-[#1e1b4b] text-white md:min-h-screen md:w-72">
      <div className="border-b border-indigo-950/40 bg-[#110e3b] p-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-indigo-500 text-sm font-extrabold shadow-md">
            {initials(user.name)}
          </span>
          <span>
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-indigo-300">
              <i className="size-2 rounded-full bg-emerald-400" />
              ระบบจัดการข้อมูลหลังบ้าน
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-indigo-300">
          <i className="fa-solid fa-layer-group mr-1.5" />
          เลือกโครงการ
        </label>
        <div className="relative">
          <select
            value={isCentral ? "central" : selectedProject}
            onChange={(event) => handleSelection(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-indigo-500/30 bg-[#110e3b] px-4 py-3 text-sm font-medium text-white shadow-inner outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="central">🏢 Mida Property (ส่วนกลาง)</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                📍 {project.name}
              </option>
            ))}
          </select>
          <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-indigo-400" />
        </div>

        <hr className="my-5 border-indigo-950/40" />
        <nav className="space-y-1">
          {isCentral ? (
            <>
              <Link href="/admin" className={menuClass("/admin")}>
                <i className="fa-solid fa-chart-pie w-4" />
                Dashboard MD (ภาพรวม)
              </Link>
              <Link href="/admin/content" className={menuClass("/admin/content")}>
                <i className="fa-solid fa-globe w-4 text-indigo-400" />
                แก้ไขหน้าเว็บไซต์ส่วนกลาง MIDA
              </Link>
              {user.role === "SUPER_ADMIN" && (
                <Link href="/admin/users" className={menuClass("/admin/users")}>
                  <i className="fa-solid fa-users-gear w-4 text-indigo-400" />
                  จัดการผู้ใช้งาน (Users)
                </Link>
              )}
              <Link
                href="/admin/projects"
                className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-indigo-500/40 px-3 py-2.5 text-xs font-medium text-indigo-300 transition hover:border-indigo-400 hover:bg-indigo-500/10 hover:text-white"
              >
                <i className="fa-solid fa-circle-plus text-indigo-400" />
                โครงการใหม่
              </Link>
            </>
          ) : (
            projectMenus.map(([section, label, icon]) => (
              <Link
                key={section}
                href={projectHref(section)}
                className={menuClass(projectHref(section), section === "leads")}
              >
                <i className={`fa-solid ${icon} w-4 ${section === "leads" ? "text-emerald-300" : "text-indigo-400"}`} />
                {label}
              </Link>
            ))
          )}
        </nav>
      </div>

      <div className="border-t border-indigo-950/40 bg-[#110e3b]/65 p-4">
        <p className="mb-3 px-1 text-xs text-indigo-300">MIDA Data Management</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
