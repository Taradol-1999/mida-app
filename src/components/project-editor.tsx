"use client";

/* The project cover endpoint is session-protected, so the preview is not proxied through next/image. */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string | null;
  location: string;
  latitude: number | string | null;
  longitude: number | string | null;
  property_type: string;
  starting_price: number | string | null;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  tags: string[] | string | null;
  description: string | null;
};
type Form = Omit<Project, "id" | "tags"> & { tags: string };
const emptyForm: Form = {
  slug: "",
  name_th: "",
  name_en: "",
  location: "",
  latitude: "",
  longitude: "",
  property_type: "DETACHED_HOUSE",
  starting_price: "",
  status: "READY",
  is_featured: false,
  is_new: true,
  tags: "",
  description: "",
};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-brand-primary focus:ring-2 focus:ring-brand-soft";

export function ProjectEditor({
  selectedProjectId,
  mode = "create",
}: {
  selectedProjectId?: string;
  mode?: "create" | "edit";
}) {
  const router = useRouter();
  const isEditMode = mode === "edit";
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
  function startEditing(project: Project) {
    setEditingId(project.id);
    setForm({
      slug: project.slug,
      name_th: project.name_th,
      name_en: project.name_en ?? "",
      location: project.location,
      latitude: project.latitude ?? "",
      longitude: project.longitude ?? "",
      property_type: project.property_type,
      starting_price: project.starting_price ?? "",
      status: project.status,
      is_featured: Boolean(project.is_featured),
      is_new: Boolean(project.is_new),
      tags: Array.isArray(project.tags)
        ? project.tags.join(", ")
        : (() => {
            try {
              return JSON.parse(String(project.tags ?? "[]")).join(", ");
            } catch {
              return String(project.tags ?? "");
            }
          })(),
      description: project.description ?? "",
    });
    setImageMissing(false);
  }
  // The API load is asynchronous; selected project data is applied after rows are available.
  useEffect(() => {
    if (isEditMode) void load();
  }, [isEditMode, load]);
  useEffect(() => {
    if (!isEditMode || !selectedProjectId || !projects.length) return;
    const project = projects.find((item) => item.id === selectedProjectId);
    if (project) {
      startEditing(project);
    } else {
      setMessage("ไม่พบข้อมูลโครงการที่เลือก");
    }
  }, [isEditMode, selectedProjectId, projects]);
  const setField = (field: keyof Form, value: string | boolean) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEditMode && !editingId) return;
    setBusy(true);
    const response = await fetch("/api/admin/projects", {
      method: isEditMode ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isEditMode ? { ...form, id: editingId } : form),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(result.message ?? "บันทึกโครงการไม่สำเร็จ");
      return;
    }
    if (isEditMode) {
      setMessage("บันทึกการแก้ไขข้อมูลโครงการเรียบร้อย");
      await load();
    } else {
      setForm(emptyForm);
      setMessage("สร้างโครงการเรียบร้อย สามารถเลือกโครงการจากเมนูด้านซ้ายเพื่อเพิ่มรูปและข้อมูลอื่นๆ");
      router.refresh();
    }
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
      router.push("/admin");
      router.refresh();
    }
  };
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">MIDA PROPERTY</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{isEditMode ? "ข้อมูลโครงการ" : "เพิ่มโครงการใหม่"}</h1>
        </div>
        <span className="rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-primary">
          <i className={`fa-solid ${isEditMode ? "fa-pen-to-square" : "fa-circle-plus"} mr-2`} />
          {isEditMode ? "แก้ไขรายโครงการ" : "สร้างใหม่เท่านั้น"}
        </span>
      </header>
      <div className="mt-6">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditMode ? `แก้ไข ${form.name_th || "ข้อมูลโครงการ"}` : "สร้างโครงการใหม่"}
              </h2>
              <p className="mt-1 text-xs text-slate-400">
                {isEditMode
                  ? "ข้อมูลส่วนนี้ใช้กับ Card โครงการ การค้นหา และหน้ารายละเอียดโครงการ"
                  : "หน้านี้ใช้สำหรับเพิ่มโครงการใหม่เท่านั้น การแก้ไขให้เลือกจากเมนูโครงการด้านซ้าย"}
              </p>
            </div>
          </div>
          {isEditMode && editingId && (
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
                  className="mt-1 inline-block text-sm font-semibold text-brand-primary hover:underline"
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
              ละติจูด (Latitude)
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.latitude ?? ""}
                onChange={(event) => setField("latitude", event.target.value)}
                placeholder="เช่น 13.8199"
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ลองจิจูด (Longitude)
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.longitude ?? ""}
                onChange={(event) => setField("longitude", event.target.value)}
                placeholder="เช่น 100.0373"
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
            <label className="text-sm font-semibold text-slate-700 md:col-span-2">
              Tag โครงการ
              <input
                value={form.tags}
                onChange={(event) => setField("tags", event.target.value)}
                placeholder="เช่น โครงการแนะนำ, โครงการล่าสุด, พร้อมเข้าอยู่ได้ทันที"
                className={inputClass}
              />
              <span className="mt-1 block text-xs font-normal text-slate-400">
                คั่นแต่ละ Tag ด้วยเครื่องหมาย comma (,)
              </span>
            </label>
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
            <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand-primary">{message}</p>
          )}
          <button
            disabled={busy || (isEditMode && !editingId)}
            className="mt-5 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-text disabled:opacity-50"
          >
            <i className="fa-solid fa-floppy-disk mr-2" />
            {busy ? "กำลังบันทึก..." : isEditMode ? "บันทึกการแก้ไข" : "สร้างโครงการ"}
          </button>
          {isEditMode && editingId && (
            <button
              type="button"
              onClick={() => {
                const project = projects.find((item) => item.id === editingId);
                if (project) void remove(project);
              }}
              className="ml-3 rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
            >
              <i className="fa-solid fa-trash-can mr-2" />
              ลบโครงการ
            </button>
          )}
        </form>
      </div>
    </>
  );
}
