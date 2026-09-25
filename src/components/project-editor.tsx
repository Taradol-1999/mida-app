"use client";

/* The project cover endpoint is session-protected, so the preview is not proxied through next/image. */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, FormEvent, useCallback, useEffect, useState } from "react";
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
type Form = Omit<Project, "id" | "tags"> & { tags: string[] };
type HomepageForm = {
  hero_title_th: string;
  hero_title_en: string;
  hero_subtitle_th: string;
  hero_subtitle_en: string;
};
type MediaItem = { id: string; name: string; mimeType: string; url: string };
type Brochure = { id: string; name: string; url: string };
const projectTagOptions = ["โครงการแนะนำ", "โครงการล่าสุด", "พร้อมเข้าอยู่ได้ทันที"] as const;

function parseProjectTags(tags: Project["tags"]) {
  let values: string[] = [];
  if (Array.isArray(tags)) {
    values = tags;
  } else if (tags) {
    try {
      const parsed = JSON.parse(tags);
      values = Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      values = tags.split(",").map((tag) => tag.trim());
    }
  }
  return projectTagOptions.filter((tag) => values.includes(tag));
}

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
  tags: [],
  description: "",
};
const emptyHomepage: HomepageForm = {
  hero_title_th: "",
  hero_title_en: "",
  hero_subtitle_th: "",
  hero_subtitle_en: "",
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
  const [homepage, setHomepage] = useState<HomepageForm>(emptyHomepage);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroImages, setHeroImages] = useState<MediaItem[]>([]);
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [brochureBusy, setBrochureBusy] = useState(false);
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
      tags: parseProjectTags(project.tags),
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
  const loadProjectHomepage = useCallback(async (projectId: string) => {
    const [settingsResponse, heroResponse, brochureResponse] = await Promise.all([
      fetch(`/api/admin/project-settings?projectId=${projectId}`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&list=1`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=brochure&list=1`),
    ]);
    const settingsData = settingsResponse.ok ? await settingsResponse.json() : { settings: null };
    const heroData = heroResponse.ok ? await heroResponse.json() : { rows: [] };
    const brochureData = brochureResponse.ok ? await brochureResponse.json() : { rows: [] };
    setHomepage({
      hero_title_th: String(settingsData.settings?.hero_title_th ?? ""),
      hero_title_en: String(settingsData.settings?.hero_title_en ?? ""),
      hero_subtitle_th: String(settingsData.settings?.hero_subtitle_th ?? ""),
      hero_subtitle_en: String(settingsData.settings?.hero_subtitle_en ?? ""),
    });
    setHeroImages(heroData.rows ?? []);
    setBrochure(brochureData.rows?.[0] ?? null);
  }, []);
  useEffect(() => {
    if (isEditMode && selectedProjectId) void loadProjectHomepage(selectedProjectId);
  }, [isEditMode, loadProjectHomepage, selectedProjectId]);
  const setField = (field: keyof Form, value: string | boolean | string[]) =>
    setForm((current) => ({ ...current, [field]: value }));
  const toggleProjectTag = (tag: (typeof projectTagOptions)[number]) =>
    setForm((current) => ({
      ...current,
      tags: current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag],
    }));
  const setHomepageField = (field: keyof HomepageForm, value: string) =>
    setHomepage((current) => ({ ...current, [field]: value }));
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
    if (!response.ok) {
      setBusy(false);
      setMessage(result.message ?? "บันทึกโครงการไม่สำเร็จ");
      return;
    }
    if (isEditMode) {
      const settingsResponse = await fetch("/api/admin/project-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...homepage, project_id: editingId }),
      });
      if (!settingsResponse.ok) {
        const settingsResult = await settingsResponse.json();
        setBusy(false);
        setMessage(settingsResult.message ?? "บันทึกข้อมูลโครงการแล้ว แต่บันทึกข้อมูลหน้าหลักไม่สำเร็จ");
        return;
      }
      for (const heroFile of heroFiles) {
        const upload = new FormData();
        upload.set("entityType", "projects");
        upload.set("entityId", String(editingId));
        upload.set("mediaKind", "hero");
        upload.set("file", heroFile);
        const imageResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
        if (!imageResponse.ok) {
          const imageResult = await imageResponse.json();
          setBusy(false);
          setMessage(imageResult.message ?? "บันทึกข้อมูลแล้ว แต่อัปโหลด Hero ไม่สำเร็จ");
          return;
        }
      }
      setHeroFiles([]);
      setMessage("บันทึกข้อมูลโครงการและข้อมูลหน้าหลักเรียบร้อย");
      await load();
      await loadProjectHomepage(String(editingId));
    } else {
      setForm(emptyForm);
      setMessage("สร้างโครงการเรียบร้อย สามารถเลือกโครงการจากเมนูด้านซ้ายเพื่อเพิ่มรูปและข้อมูลอื่นๆ");
      router.refresh();
    }
    setBusy(false);
  };
  const removeHero = async (id: string) => {
    if (!editingId || !window.confirm("ต้องการลบไฟล์ Hero นี้ใช่หรือไม่?")) return;
    const response = await fetch(
      `/api/admin/media?entityType=projects&entityId=${editingId}&mediaKind=hero&mediaId=${id}`,
      { method: "DELETE" },
    );
    if (response.ok) setHeroImages((items) => items.filter((item) => item.id !== id));
  };
  const uploadBrochure = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !editingId) return;
    setBrochureBusy(true);
    setMessage("");
    const upload = new FormData();
    upload.set("entityType", "projects");
    upload.set("entityId", editingId);
    upload.set("mediaKind", "brochure");
    upload.set("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: upload });
    const result = await response.json();
    event.target.value = "";
    setBrochureBusy(false);
    if (!response.ok) {
      setMessage(result.message ?? "อัปโหลดโบรชัวร์ไม่สำเร็จ");
      return;
    }
    await loadProjectHomepage(editingId);
    setMessage("อัปโหลดโบรชัวร์เรียบร้อย");
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
              ชื่อโครงการ (ภาษาไทย)
              <span className="ml-1 text-rose-600">*</span>
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
              Slug สำหรับ URL
              <span className="ml-1 text-rose-600">*</span>
              <input
                required
                value={form.slug}
                onChange={(event) => setField("slug", event.target.value)}
                className={inputClass}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ทำเล / จังหวัด
              <span className="ml-1 text-rose-600">*</span>
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
            <fieldset className="md:col-span-2">
              <legend className="text-sm font-semibold text-slate-700">Tag โครงการ</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {projectTagOptions.map((tag) => {
                  const selected = form.tags.includes(tag);
                  return (
                    <label
                      key={tag}
                      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        selected
                          ? "border-brand-primary bg-brand-primary text-white shadow-sm"
                          : "border-slate-300 bg-white text-slate-600 hover:border-brand-accent hover:bg-brand-accent-soft"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleProjectTag(tag)}
                        className="sr-only"
                      />
                      <i className={`fa-solid ${selected ? "fa-circle-check" : "fa-tag"} mr-2`} />
                      {tag}
                    </label>
                  );
                })}
              </div>
              <p className="mt-2 text-xs font-normal text-slate-400">เลือกได้เฉพาะ 3 Tag ที่กำหนด และเลือกได้มากกว่า 1 รายการ</p>
            </fieldset>
            <label className="md:col-span-2 text-sm font-semibold text-slate-700">
              รายละเอียดโครงการ
              <textarea
                value={form.description ?? ""}
                onChange={(event) => setField("description", event.target.value)}
                className={`${inputClass} min-h-28`}
              />
            </label>
          </div>
          {isEditMode && editingId && (
            <div className="mt-8 border-t border-slate-200 pt-7">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">PROJECT HOMEPAGE</p>
                <h2 className="mt-1 text-lg font-bold text-slate-800">ข้อมูลหน้าหลักโครงการ</h2>
                <p className="mt-1 text-xs text-slate-400">ข้อความ Hero รูปภาพ/วิดีโอสไลด์ และโบรชัวร์</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  คำพาดหัวหลัก - ภาษาไทย
                  <input
                    value={homepage.hero_title_th}
                    onChange={(event) => setHomepageField("hero_title_th", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Main Headline - English
                  <input
                    value={homepage.hero_title_en}
                    onChange={(event) => setHomepageField("hero_title_en", event.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  คำอธิบายเพิ่มเติม - ภาษาไทย
                  <textarea
                    value={homepage.hero_subtitle_th}
                    onChange={(event) => setHomepageField("hero_subtitle_th", event.target.value)}
                    className={`${inputClass} min-h-24`}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Sub-headline - English
                  <textarea
                    value={homepage.hero_subtitle_en}
                    onChange={(event) => setHomepageField("hero_subtitle_en", event.target.value)}
                    className={`${inputClass} min-h-24`}
                  />
                </label>
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold text-slate-700">รูปภาพหรือวิดีโอสไลด์แบนเนอร์หลัก</p>
                <label className="mt-2 flex min-h-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-400 hover:border-brand-primary hover:bg-brand-soft">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                    className="sr-only"
                    onChange={(event) => setHeroFiles(Array.from(event.target.files ?? []))}
                  />
                  <span>
                    <i className="fa-solid fa-photo-film mr-2 text-2xl align-middle text-brand-primary" />
                    {heroFiles.length ? `เลือกแล้ว ${heroFiles.length} ไฟล์` : "คลิกเพื่อเลือกรูปภาพหรือวิดีโอหลายไฟล์"}
                  </span>
                </label>
                <p className="mt-2 text-xs text-slate-400">
                  รองรับ JPG, PNG, WEBP ไม่เกิน 5 MB และ MP4, WEBM ไม่เกิน 50 MB ต่อไฟล์
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                  {heroImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100"
                    >
                      {image.mimeType.startsWith("video/") ? (
                        <video
                          src={image.url}
                          className="h-24 w-full object-cover"
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img src={image.url} alt={image.name} className="h-24 w-full object-cover" />
                      )}
                      <button
                        type="button"
                        onClick={() => void removeHero(image.id)}
                        aria-label={`ลบ ${image.name}`}
                        className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-rose-600 text-xs text-white"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-brand-primary/10 bg-brand-soft/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-rose-100 text-rose-600">
                      <i className="fa-solid fa-file-pdf" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-700">โบรชัวร์โครงการ</p>
                      {brochure ? (
                        <a
                          href={brochure.url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block truncate text-xs font-semibold text-brand-primary hover:underline"
                        >
                          {brochure.name}
                        </a>
                      ) : (
                        <p className="mt-1 text-xs text-slate-500">ยังไม่มีไฟล์โบรชัวร์</p>
                      )}
                    </div>
                  </div>
                  <label className="cursor-pointer rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-text">
                    <i className="fa-solid fa-cloud-arrow-up mr-2" />
                    {brochureBusy ? "กำลังอัปโหลด..." : brochure ? "เปลี่ยนโบรชัวร์" : "อัปโหลดโบรชัวร์"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      disabled={brochureBusy}
                      onChange={(event) => void uploadBrochure(event)}
                    />
                  </label>
                </div>
              </div>
            </div>
          )}
          {message && (
            <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand-primary">{message}</p>
          )}
          <button
            disabled={busy || (isEditMode && !editingId)}
            className="mt-5 rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-text disabled:opacity-50"
          >
            <i className="fa-solid fa-floppy-disk mr-2" />
            {busy ? "กำลังบันทึก..." : isEditMode ? "บันทึกข้อมูลโครงการทั้งหมด" : "สร้างโครงการ"}
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
