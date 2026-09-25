"use client";

import { Select } from "@/components/ui/form-controls";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { SessionUser } from "@/lib/auth";
import { LogoutButton } from "@/components/logout-button";

type ProjectNavigation = { id: string; name: string };
const projectMenus = [
  ["dashboard", "Dashboard HP", "fa-chart-line"],
  ["project-info", "ข้อมูลโครงการ", "fa-building"],
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
    `flex w-full items-center gap-3 rounded-xl border-l-4 px-4 py-3 text-sm font-medium transition ${pathname === href ? "border-brand-accent bg-white text-brand-primary shadow-sm" : accent ? "border-transparent text-brand-accent hover:bg-white/10" : "border-transparent text-white/75 hover:bg-white/10 hover:text-white"}`;
  const projectHref = (section: string) => `/admin/project/${selectedProject}/${section}`;
  const handleSelection = (value: string) =>
    router.push(value === "central" ? "/admin" : `/admin/project/${value}/project-info`);

  return (
    <aside className="flex w-full shrink-0 flex-col bg-brand-primary text-white md:min-h-screen md:w-72">
      <div className="border-b border-white/15 bg-brand-primary p-5">
        <Link href="/admin" className="flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-full bg-brand-accent text-sm font-extrabold text-brand-primary shadow-md">
            {initials(user.name)}
          </span>
          <span>
            <span className="block text-sm font-semibold">{user.name}</span>
            <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-white/65">
              <i className="size-2 rounded-full bg-emerald-400" />
              ระบบจัดการข้อมูลหลังบ้าน
            </span>
          </span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-wide text-white/65">
          <i className="fa-solid fa-layer-group mr-1.5" />
          เลือกโครงการ
        </label>
        <div className="relative">
          <Select
            variant="plain"
            value={isCentral ? "central" : selectedProject}
            onChange={(event) => handleSelection(event.target.value)}
            className="w-full cursor-pointer appearance-none rounded-xl border border-white/25 bg-brand-primary px-4 py-3 text-sm font-medium text-white shadow-inner outline-none focus:ring-2 focus:ring-white/60"
          >
            {user.role === "SUPER_ADMIN" ? (
              <option value="central">🏢 Mida Property (ส่วนกลาง)</option>
            ) : (
              <option value="central" disabled>
                เลือกโครงการที่ได้รับมอบหมาย
              </option>
            )}
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                📍 {project.name}
              </option>
            ))}
          </Select>
          <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-white/65" />
        </div>

        <hr className="my-5 border-white/15" />
        <nav className="space-y-1">
          {isCentral ? (
            user.role === "SUPER_ADMIN" ? (
              <>
                <Link href="/admin" className={menuClass("/admin")}>
                  <i className="fa-solid fa-chart-pie w-4" />
                  Dashboard MD (ภาพรวม)
                </Link>
                <Link href="/admin/content" className={menuClass("/admin/content")}>
                  <i className="fa-solid fa-display w-4" />
                  Mida Property (ส่วนกลาง)
                </Link>
                {user.role === "SUPER_ADMIN" && (
                  <Link href="/admin/users" className={menuClass("/admin/users")}>
                    <i className="fa-solid fa-users-gear w-4" />
                    จัดการผู้ใช้งาน (Users)
                  </Link>
                )}
                <Link
                  href="/admin/projects"
                  className={`mt-3 flex items-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-medium transition ${pathname === "/admin/projects" ? "border-brand-accent bg-white text-brand-primary shadow-sm" : "border-dashed border-white/30 text-white/70 hover:border-white/60 hover:bg-white/10 hover:text-white"}`}
                >
                  <i className="fa-solid fa-circle-plus" />
                  โครงการใหม่
                </Link>
              </>
            ) : (
              <p className="px-3 text-sm text-white/75">เลือกโครงการที่ได้รับมอบหมายเพื่อจัดการข้อมูล</p>
            )
          ) : (
            projectMenus.map(([section, label, icon]) => (
              <Link
                key={section}
                href={projectHref(section)}
                className={menuClass(projectHref(section), section === "leads")}
              >
                <i
                  className={`fa-solid ${icon} w-4 ${pathname === projectHref(section) ? "text-brand-accent" : section === "leads" ? "text-brand-accent" : "text-white/70"}`}
                />
                {label}
              </Link>
            ))
          )}
        </nav>
      </div>

      <div className="border-t border-white/15 bg-black/10 p-4">
        <p className="mb-3 px-1 text-xs text-white/65">MIDA Data Management</p>
        <LogoutButton />
      </div>
    </aside>
  );
}
