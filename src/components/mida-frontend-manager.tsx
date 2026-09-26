"use client";

import { BannerMediaUpload } from "@/components/banner-media-upload";

import { Input, Textarea } from "@/components/ui/form-controls";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";

type Media = { id: string; name: string; mimeType: string; url: string };
type HomepageProject = { id: string; name_th: string; location: string; status: "READY" | "CONSTRUCTION" };

export function MidaFrontendManager() {
  const [contentId, setContentId] = useState("");
  const [headline, setHeadline] = useState("");
  const [headlineEn, setHeadlineEn] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [images, setImages] = useState<Media[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [projects, setProjects] = useState<HomepageProject[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadImages = useCallback(async (id: string) => {
    if (!id) return setImages([]);
    const response = await fetch(`/api/admin/media?entityType=site-content&entityId=${id}&mediaKind=hero&list=1`);
    const data = response.ok ? await response.json() : { rows: [] };
    setImages(data.rows ?? []);
  }, []);

  const load = useCallback(async () => {
    const [response, projectResponse] = await Promise.all([
      fetch("/api/admin/content"),
      fetch("/api/admin/homepage-projects"),
    ]);
    if (!response.ok) return setMessage("ไม่สามารถโหลดข้อมูลเว็บไซต์ส่วนกลางได้");
    const data = await response.json();
    if (projectResponse.ok) {
      const projectData = await projectResponse.json();
      setProjects(projectData.projects ?? []);
      setSelectedProjectIds(projectData.project_ids ?? []);
    }
    const home = (data.rows ?? []).find((row: Record<string, unknown>) => row.content_key === "home_hero");
    if (!home) return;
    const id = String(home.id);
    setContentId(id);
    setHeadline(String(home.title ?? ""));
    setHeadlineEn(String(home.title_en ?? ""));
    setDescription(String(home.body ?? ""));
    setDescriptionEn(String(home.body_en ?? ""));
    await loadImages(id);
  }, [loadImages]);

  useEffect(() => void load(), [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/content", {
      method: contentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: contentId,
        content_key: "home_hero",
        title: headline,
        title_en: headlineEn,
        body: description,
        body_en: descriptionEn,
      }),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.message ?? "บันทึกข้อมูลไม่สำเร็จ");
      setBusy(false);
      return;
    }
    const result = await response.json();
    const savedContentId = contentId || String(result.id ?? "");
    if (!savedContentId) {
      setMessage("บันทึกข้อมูลแล้ว แต่ไม่สามารถระบุรายการสำหรับอัปโหลดสื่อได้");
      setBusy(false);
      return;
    }
    if (!contentId) setContentId(savedContentId);
    for (const file of files) {
      const upload = new FormData();
      upload.set("entityType", "site-content");
      upload.set("entityId", savedContentId);
      upload.set("mediaKind", "hero");
      upload.set("file", file);
      const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
      if (!uploadResponse.ok) {
        setMessage("บันทึกข้อความแล้ว แต่มีไฟล์สไลด์บางรายการอัปโหลดไม่สำเร็จ");
        setBusy(false);
        return;
      }
    }
    const selectionResponse = await fetch("/api/admin/homepage-projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ project_ids: selectedProjectIds }),
    });
    if (!selectionResponse.ok) {
      setMessage("บันทึกข้อความแล้ว แต่ไม่สามารถบันทึกรายการโครงการหน้าแรกได้");
      setBusy(false);
      return;
    }
    setFiles([]);
    await loadImages(savedContentId);
    setMessage("บันทึกข้อมูลเว็บไซต์ส่วนกลาง MIDA เรียบร้อย");
    setBusy(false);
  }

  async function removeImage(id: string) {
    if (!confirm("ต้องการลบรูปสไลด์นี้ใช่หรือไม่")) return;
    const response = await fetch(
      `/api/admin/media?entityType=site-content&entityId=${contentId}&mediaKind=hero&mediaId=${id}`,
      { method: "DELETE" },
    );
    if (response.ok) setImages((current) => current.filter((image) => image.id !== id));
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <header className="border-b border-slate-100 pb-4">
        <h1 className="text-base font-bold text-slate-800">
          <i className="fa-solid fa-display mr-2 text-brand-primary" />
          Mida Property (ส่วนกลาง)
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          ส่วนควบคุมและแก้ไขข้อมูลหน้าแรก สไลเดอร์หลัก และเนื้อหาของหน้าเว็บใหญ่ (Corporate Website)
        </p>
      </header>
      <form onSubmit={save} className="mt-6 space-y-5 text-sm">
        <div className="grid gap-5 md:grid-cols-2">
        <label className="block font-semibold text-slate-700">
          คำพาดหัวหลัก (TH)
          <Input
            required
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block font-semibold text-slate-700">
          คำพาดหัวหลัก (EN)
          <Input
            value={headlineEn}
            onChange={(event) => setHeadlineEn(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block font-semibold text-slate-700">
          คำอธิบายหน้าแรก (TH)
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block font-semibold text-slate-700">
          คำอธิบายหน้าแรก (EN)
          <Textarea
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        </div>
        <div className="mt-6">
          <BannerMediaUpload
            title="รูปภาพและวิดีโอแบนเนอร์สไลด์หลักหน้าแรกส่วนกลาง"
            media={images}
            files={files}
            onFilesChange={setFiles}
            onRemove={removeImage}
            disabled={busy}
          />
        </div>

        <fieldset className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <legend className="font-bold text-slate-800">
                <i className="fa-solid fa-building-circle-check mr-2 text-brand-primary" />
                โครงการที่แสดงบนหน้าแรก
              </legend>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                เลือกเฉพาะโครงการที่ต้องการแสดงในหน้าแรก ผู้ชมสามารถดูครบทุกโครงการได้จากหน้า “โครงการทั้งหมด”
              </p>
            </div>
            <span className="rounded-full bg-brand-primary px-3 py-1.5 text-xs font-bold text-white">
              เลือกแล้ว {selectedProjectIds.length} โครงการ
            </span>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {projects.map((project) => {
              const selectedIndex = selectedProjectIds.indexOf(project.id);
              const checked = selectedIndex >= 0;
              return (
                <label
                  key={project.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${checked ? "border-brand-primary bg-white shadow-sm" : "border-slate-200 bg-white/60 hover:border-brand-primary/40"}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setSelectedProjectIds((current) =>
                        current.includes(project.id)
                          ? current.filter((id) => id !== project.id)
                          : [...current, project.id],
                      )
                    }
                    className="size-4 accent-[#002D62]"
                  />
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-sm text-slate-800">{project.name_th}</b>
                    <span className="block text-xs text-slate-500">{project.location}</span>
                  </span>
                  {checked && (
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-accent text-[11px] font-black text-brand-primary"
                      title={`ลำดับ ${selectedIndex + 1}`}
                    >
                      {selectedIndex + 1}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {!projects.length && <p className="mt-3 text-xs text-slate-500">ยังไม่มีโครงการสำหรับเลือก</p>}
        </fieldset>

        {message && <p className="rounded-lg bg-brand-soft px-4 py-3 text-brand-primary">{message}</p>}
        <button
          disabled={busy}
          className="rounded-lg bg-brand-primary px-5 py-2.5 font-medium text-white shadow-sm disabled:opacity-50"
        >
          {busy ? "กำลังบันทึก..." : "บันทึกข้อมูลเว็บไซต์ส่วนกลาง"}
        </button>
      </form>
    </section>
  );
}
