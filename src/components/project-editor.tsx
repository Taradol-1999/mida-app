"use client";

/* The project cover endpoint is session-protected, so the preview is not proxied through next/image. */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Project = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string | null;
  location: string;
  property_type: string;
  starting_price: number | string | null;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  description: string | null;
};
type Form = Omit<Project, "id">;
const emptyForm: Form = {
  slug: "",
  name_th: "",
  name_en: "",
  location: "",
  property_type: "DETACHED_HOUSE",
  starting_price: "",
  status: "READY",
  is_featured: false,
  is_new: true,
  description: "",
};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function ProjectEditor({ selectedProjectId }: { selectedProjectId?: string }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [imageMissing, setImageMissing] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/projects");
    if (!response.ok) {
      setMessage("ไม่สามารถโหลดข้อมูลโครงการได้");
      return;
    }
    const data = await response.json();
    setProjects(data.rows ?? []);
  }, []);
  // The API load is asynchronous; selected project data is applied after rows are available.
  useEffect(() => {
    void load();
  }, [load]);
  useEffect(() => {
    if (!selectedProjectId || !projects.length) return;
    const project = projects.find((item) => item.id === selectedProjectId);
    if (project) startEditing(project);
  }, [selectedProjectId, projects]);
  const setField = (field: keyof Form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));
  function startEditing(project: Project) {
    setEditingId(project.id);
    setForm({
      slug: project.slug,
      name_th: project.name_th,
      name_en: project.name_en ?? "",
      location: project.location,
      property_type: project.property_type,
      starting_price: project.starting_price ?? "",
      status: project.status,
      is_featured: Boolean(project.is_featured),
      is_new: Boolean(project.is_new),
      description: project.description ?? "",
    });
    setImageMissing(false);
    setMessage(`กำลังแก้ไขข้อมูล ${project.name_th}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
    setImageMissing(false);
    setMessage("");
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/projects", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editingId ? { ...form, id: editingId } : form),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(result.message ?? "บันทึกโครงการไม่สำเร็จ");
      return;
    }
    setMessage("บันทึกข้อมูลโครงการเรียบร้อย");
    if (!editingId) reset();
    await load();
  };
  const remove = async (project: Project) => {
    if (!window.confirm(`ต้องการลบ ${project.name_th} หรือไม่?`)) return;
    const response = await fetch("/api/admin/projects", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.id }),
    });
    const result = await response.json();
    setMessage(response.ok ? "ลบโครงการแล้ว" : (result.message ?? "ลบโครงการไม่สำเร็จ"));
    if (response.ok) {
      if (editingId === project.id) reset();
      await load();
    }
  };
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">MIDA PROPERTY</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">จัดการโครงการ</h1>
          <p className="mt-1 text-sm text-slate-500">
            เลือกโครงการจาก Sidebar หรือกดแก้ไขเพื่อดึงข้อมูลเดิมมาแสดงในฟอร์ม
          </p>
        </div>
        <span className="rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700">
          {projects.length} โครงการในระบบ
        </span>
      </header>
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 flex items-start justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? "แก้ไขข้อมูลโครงการ" : "สร้างโครงการใหม่"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">ข้อมูลที่บันทึกจะแสดงทั้งหลังบ้านและหน้าเว็บไซต์</p>
            </div>
            {editingId && (
              <button
                type="button"
                onClick={reset}
                className="text-sm font-semibold text-slate-500 hover:text-slate-800"
              >
                ยกเลิก
              </button>
            )}
          </div>
          {editingId && (
            <div className="mb-5 flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 p-4">
              <div className="grid size-24 place-items-center overflow-hidden rounded-lg bg-slate-200">
                {!imageMissing && (
                  <img
                    src={`/api/admin/media?entityType=projects&entityId=${editingId}`}
                    alt="ภาพปกโครงการ"
                    className="size-full object-cover"
                    onError={() => setImageMissing(true)}
                  />
                )}
                {imageMissing && <i className="fa-regular fa-image text-2xl text-slate-400" />}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-700">ภาพปกโครงการ</p>
                <Link
                  href={`/admin/media?project=${editingId}`}
                  className="mt-1 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                >
                  <i className="fa-solid fa-cloud-arrow-up mr-1" />
                  อัปโหลดหรือเปลี่ยนรูปภาพ
                </Link>
              </div>
            </div>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              ชื่อโครงการ (ภาษาไทย) *
              <input
                required
                value={form.name_th}
                onChange={(event) => setField("name_th", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ชื่อโครงการ (ภาษาอังกฤษ)
              <input
                value={form.name_en ?? ""}
                onChange={(event) => setField("name_en", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Slug สำหรับ URL *
              <input
                required
                value={form.slug}
                onChange={(event) => setField("slug", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ทำเล / จังหวัด *
              <input
                required
                value={form.location}
                onChange={(event) => setField("location", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ประเภทโครงการ
              <select
                value={form.property_type}
                onChange={(event) => setField("property_type", event.target.value)}
                className={inputClass}
              >
                <option value="DETACHED_HOUSE">บ้านเดี่ยว</option>
                <option value="SEMI_DETACHED">บ้านแฝด</option>
                <option value="TOWNHOME">ทาวน์โฮม</option>
                <option value="COMMERCIAL">อาคารพาณิชย์</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ราคาเริ่มต้น (บาท)
              <input
                type="number"
                value={form.starting_price ?? ""}
                onChange={(event) => setField("starting_price", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              สถานะการแสดงผล
              <select
                value={form.status}
                onChange={(event) => setField("status", event.target.value)}
                className={inputClass}
              >
                <option value="READY">พร้อมอยู่ / เปิดขาย</option>
                <option value="CONSTRUCTION">กำลังก่อสร้าง</option>
                <option value="ARCHIVED">เก็บถาวร / ซ่อน</option>
              </select>
            </label>
            <div className="grid gap-2 sm:grid-cols-2 md:col-span-2">
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(event) => setField("is_featured", event.target.checked)}
                  className="size-4 accent-indigo-600"
                />
                ✦ โครงการแนะนำ
              </label>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.is_new}
                  onChange={(event) => setField("is_new", event.target.checked)}
                  className="size-4 accent-indigo-600"
                />
                โครงการล่าสุด
              </label>
            </div>
            <label className="md:col-span-2 text-sm font-semibold text-slate-700">
              รายละเอียดโครงการ
              <textarea
                value={form.description ?? ""}
                onChange={(event) => setField("description", event.target.value)}
                className={`${inputClass} min-h-28`}
              />
            </label>
          </div>
          {message && (
            <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">{message}</p>
          )}
          <button
            disabled={busy}
            className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            <i className="fa-solid fa-floppy-disk mr-2" />
            {busy ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "สร้างโครงการ"}
          </button>
        </form>
        <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-800">โครงการในระบบ</h2>
          <div className="mt-3 space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className={`rounded-xl border p-3 ${editingId === project.id ? "border-indigo-300 bg-indigo-50" : "border-slate-100"}`}
              >
                <p className="font-bold text-slate-700">{project.name_th}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {project.location} · {Number(project.starting_price ?? 0).toLocaleString("th-TH")} บาท
                </p>
                <div className="mt-2 flex gap-3 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => startEditing(project)}
                    className="text-indigo-600 hover:underline"
                  >
                    แก้ไขข้อมูล
                  </button>
                  <button type="button" onClick={() => void remove(project)} className="text-rose-600 hover:underline">
                    ลบ
                  </button>
                </div>
              </div>
            ))}
            {!projects.length && <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีโครงการ</p>}
          </div>
        </aside>
      </div>
    </>
  );
}
