"use client";

import { Input } from "@/components/ui/form-controls";

/* The image endpoint is session-protected, so this admin preview is intentionally not proxied through next/image. */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type Project = { id: string; name_th: string; location: string };

export function AdminMediaManager() {
  const searchParams = useSearchParams();
  const selectedProject = searchParams.get("project");
  const [projects, setProjects] = useState<Project[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [versions, setVersions] = useState<Record<string, number>>({});
  const [missing, setMissing] = useState<Record<string, boolean>>({});
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/projects");
    if (!response.ok) {
      setMessage("ไม่สามารถโหลดรายชื่อโครงการได้");
      return;
    }
    const data = await response.json();
    setProjects(data.rows ?? []);
  }, []);
  // Data is loaded from the authenticated admin API after this client component mounts.
  useEffect(() => {
    void load();
  }, [load]);
  const upload = async (project: Project, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(project.id);
    setMessage("");
    const form = new FormData();
    form.append("entityType", "projects");
    form.append("entityId", project.id);
    form.append("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: form });
    const result = await response.json();
    setBusy(null);
    event.target.value = "";
    if (!response.ok) {
      setMessage(result.message ?? "อัปโหลดรูปไม่สำเร็จ");
      return;
    }
    setMissing((current) => ({ ...current, [project.id]: false }));
    setVersions((current) => ({ ...current, [project.id]: Date.now() }));
    setMessage(`อัปโหลดรูปภาพของ ${project.name_th} เรียบร้อย`);
  };
  const visibleProjects = selectedProject ? projects.filter((project) => project.id === selectedProject) : projects;
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">PROJECT MEDIA</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">จัดการรูปภาพโครงการ</h1>
          <p className="mt-1 text-sm text-slate-500">อัปโหลดไฟล์ภาพเข้าสู่เครื่องโดยตรง ไม่ใช้ URL ภายนอก</p>
        </div>
        <span className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-primary">
          JPG · PNG · WEBP · ไม่เกิน 5 MB
        </span>
      </header>
      {message && (
        <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-sm font-medium text-brand-primary">{message}</p>
      )}
      <section className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {visibleProjects.map((project) => (
          <article key={project.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="relative aspect-video bg-slate-100">
              {!missing[project.id] && (
                <img
                  src={`/api/admin/media?entityType=projects&entityId=${project.id}&v=${versions[project.id] ?? 0}`}
                  alt={`รูปภาพ ${project.name_th}`}
                  className="size-full object-cover"
                  onError={() => setMissing((current) => ({ ...current, [project.id]: true }))}
                />
              )}
              {missing[project.id] && (
                <div className="grid size-full place-items-center text-slate-400">
                  <i className="fa-regular fa-image text-4xl" />
                </div>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-bold text-slate-800">{project.name_th}</h2>
              <p className="mt-1 text-sm text-slate-400">{project.location}</p>
              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-text">
                <i className="fa-solid fa-cloud-arrow-up" />
                {busy === project.id ? "กำลังอัปโหลด..." : "อัปโหลดรูปภาพ"}
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={busy === project.id}
                  onChange={(event) => void upload(project, event)}
                />
              </label>
            </div>
          </article>
        ))}
        {!visibleProjects.length && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-400">
            ยังไม่มีโครงการในระบบ
          </p>
        )}
      </section>
    </>
  );
}
