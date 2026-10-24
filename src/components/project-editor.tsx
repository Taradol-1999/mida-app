"use client";

import { BannerMediaUpload } from "@/components/banner-media-upload";
import { FileDropzone } from "@/components/file-dropzone";
import { ProjectLogoUpload } from "@/components/project-logo-upload";
import { ContactWidgetSettings, type ContactWidgetValues } from "@/components/contact-widget-settings";

import { Input, Textarea, Select } from "@/components/ui/form-controls";
import { confirmDelete } from "@/lib/admin-alert";

/* The project cover endpoint is session-protected, so the preview is not proxied through next/image. */
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string | null;
  location: string;
  location_en: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  property_type: string;
  starting_price: number | string | null;
  status: string;
  is_featured: boolean;
  is_new: boolean;
  tags: string[] | string | null;
  description: string | null;
  description_en: string | null;
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
  location_en: "",
  province: "",
  district: "",
  subdistrict: "",
  latitude: "",
  longitude: "",
  property_type: "DETACHED_HOUSE",
  starting_price: "",
  status: "READY",
  is_featured: false,
  is_new: true,
  tags: [],
  description: "",
  description_en: "",
};
const emptyHomepage: HomepageForm = {
  hero_title_th: "",
  hero_title_en: "",
  hero_subtitle_th: "",
  hero_subtitle_en: "",
};

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
  const [coverBusy, setCoverBusy] = useState(false);
  const [coverVersion, setCoverVersion] = useState(0);
  const [homepage, setHomepage] = useState<HomepageForm>(emptyHomepage);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroImages, setHeroImages] = useState<MediaItem[]>([]);
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [brochureBusy, setBrochureBusy] = useState(false);
  const [contact, setContact] = useState<ContactWidgetValues>({ line: "", messenger: "", phone: "", email: "" });
  const [contactReady, setContactReady] = useState(false);
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
      location_en: project.location_en ?? "",
      province: project.province ?? "",
      district: project.district ?? "",
      subdistrict: project.subdistrict ?? "",
      latitude: project.latitude ?? "",
      longitude: project.longitude ?? "",
      property_type: project.property_type,
      starting_price: project.starting_price ?? "",
      status: project.status,
      is_featured: Boolean(project.is_featured),
      is_new: Boolean(project.is_new),
      tags: parseProjectTags(project.tags),
      description: project.description ?? "",
      description_en: project.description_en ?? "",
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
    setContactReady(false);
    const [settingsResponse, heroResponse, brochureResponse, contactResponse] = await Promise.all([
      fetch(`/api/admin/project-settings?projectId=${projectId}`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&list=1`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=brochure&list=1`),
      fetch(`/api/admin/project-contact?projectId=${projectId}`),
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
    if (contactResponse.ok) {
      setContact(await contactResponse.json());
      setContactReady(true);
    } else setMessage("โหลดช่องทางติดต่อไม่สำเร็จ กรุณารีเฟรชหน้าอีกครั้ง");
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
    if (isEditMode && (!editingId || !contactReady)) return;
    setBusy(true);
    const response = await fetch("/api/admin/projects", {
      method: isEditMode ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isEditMode
          ? { ...form, id: editingId }
          : {
              ...form,
              location: form.location || [form.subdistrict, form.district, form.province].filter(Boolean).join(" "),
            },
      ),
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
      const contactResponse = await fetch("/api/admin/project-contact", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: editingId, contact }),
      });
      if (!contactResponse.ok) {
        const result = await contactResponse.json();
        setBusy(false);
        setMessage(result.message ?? "บันทึกช่องทางติดต่อไม่สำเร็จ");
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
    if (!editingId || !(await confirmDelete("ต้องการลบไฟล์ Hero นี้ใช่หรือไม่?", "ยืนยันการลบ Hero"))) return;
    const response = await fetch(
      `/api/admin/media?entityType=projects&entityId=${editingId}&mediaKind=hero&mediaId=${id}`,
      { method: "DELETE" },
    );
    if (response.ok) setHeroImages((items) => items.filter((item) => item.id !== id));
  };
  const uploadCover = async (file?: File) => {
    if (!file || !editingId) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("กรุณาเลือกรูป JPG, PNG หรือ WEBP ขนาดไม่เกิน 5 MB");
      return;
    }
    setCoverBusy(true);
    try {
      const upload = new FormData();
      upload.set("entityType", "projects");
      upload.set("entityId", editingId);
      upload.set("mediaKind", "cover");
      upload.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: upload });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "อัปโหลดภาพปกไม่สำเร็จ");
      setImageMissing(false);
      setCoverVersion(Date.now());
      setMessage("อัปโหลดภาพปกเรียบร้อย");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดภาพปกไม่สำเร็จ");
    } finally {
      setCoverBusy(false);
    }
  };
  const uploadBrochure = async (file?: File) => {
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
    setBrochureBusy(false);
    if (!response.ok) {
      setMessage(result.message ?? "อัปโหลดโบรชัวร์ไม่สำเร็จ");
      return;
    }
    await loadProjectHomepage(editingId);
    setMessage("อัปโหลดโบรชัวร์เรียบร้อย");
  };
  const remove = async (project: Project) => {
    if (!(await confirmDelete(`ต้องการลบ ${project.name_th} หรือไม่?`, "ยืนยันการลบโครงการ"))) return;
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
      </header>
      <div className="mt-6">
        <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="mb-5 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {isEditMode ? `แก้ไข ${form.name_th || "ข้อมูลโครงการ"}` : "สร้างโครงการใหม่"}
              </h2>
            </div>
          </div>
          {isEditMode && editingId && (
            <div className="mb-5 grid gap-4 lg:grid-cols-2">
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                <div className="min-w-0 w-full">
                  <p className="text-sm font-bold text-slate-700">ภาพปกโครงการ</p>
                  <FileDropzone
                    title={coverBusy ? "กำลังอัปโหลด..." : "ลากและวางภาพปกที่นี่"}
                    hint="JPG, PNG, WEBP · ไม่เกิน 5 MB"
                    accept="image/jpeg,image/png,image/webp"
                    disabled={coverBusy}
                    className="mt-3"
                    onFilesChange={(files) => void uploadCover(files[0])}
                    preview={
                      !imageMissing ? (
                        <img
                          key={`${editingId}-${coverVersion}`}
                          src={`/api/admin/media?entityType=projects&entityId=${editingId}&v=${coverVersion}`}
                          alt="ภาพปกโครงการ"
                          className="mx-auto h-36 max-w-full rounded-lg object-contain"
                          onError={() => setImageMissing(true)}
                        />
                      ) : undefined
                    }
                  />
                </div>
              </div>
              <ProjectLogoUpload key={editingId} projectId={editingId} />
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-semibold text-slate-700">
              ชื่อโครงการ (TH)
              <span className="ml-1 text-rose-600">*</span>
              <Input required value={form.name_th} onChange={(event) => setField("name_th", event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ชื่อโครงการ (EN)
              <Input value={form.name_en ?? ""} onChange={(event) => setField("name_en", event.target.value)} />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              Slug สำหรับ URL
              <span className="ml-1 text-rose-600">*</span>
              <Input required value={form.slug} onChange={(event) => setField("slug", event.target.value)} />
            </label>

            <label className="text-sm font-semibold text-slate-700">
              ประเภทโครงการ
              <Select value={form.property_type} onChange={(event) => setField("property_type", event.target.value)}>
                <option value="DETACHED_HOUSE">บ้านเดี่ยว</option>
                <option value="SEMI_DETACHED">บ้านแฝด</option>
                <option value="TOWNHOME">ทาวน์โฮม</option>
                <option value="COMMERCIAL">อาคารพาณิชย์</option>
              </Select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              ราคาเริ่มต้น (บาท)
              <Input
                type="number"
                value={form.starting_price ?? ""}
                onChange={(event) => setField("starting_price", event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              สถานะการแสดงผล
              <Select value={form.status} onChange={(event) => setField("status", event.target.value)}>
                <option value="READY">พร้อมอยู่ / เปิดขาย</option>
                <option value="CONSTRUCTION">กำลังก่อสร้าง</option>
                <option value="ARCHIVED">เก็บถาวร / ซ่อน</option>
              </Select>
            </label>
            <label className="text-sm font-semibold text-slate-700">
              จังหวัด <span className="ml-1 text-rose-600">*</span>
              <Input
                required
                value={form.province ?? ""}
                onChange={(event) => setField("province", event.target.value)}
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              เขต / อำเภอ <span className="ml-1 text-rose-600">*</span>
              <Input
                required
                value={form.district ?? ""}
                onChange={(event) => setField("district", event.target.value)}
              />
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
                      <Input
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
              <p className="mt-2 text-xs font-normal text-slate-400">
                เลือกได้เฉพาะ 3 Tag ที่กำหนด และเลือกได้มากกว่า 1 รายการ
              </p>
            </fieldset>
            <label className="text-sm font-semibold text-slate-700">
              รายละเอียดโครงการ (TH)
              <Textarea
                value={form.description ?? ""}
                onChange={(event) => setField("description", event.target.value)}
                className="min-h-28"
              />
            </label>
            <label className="text-sm font-semibold text-slate-700">
              รายละเอียดโครงการ (EN)
              <Textarea
                value={form.description_en ?? ""}
                onChange={(event) => setField("description_en", event.target.value)}
                className="min-h-28"
              />
            </label>
          </div>
          {isEditMode && editingId && (
            <div className="mt-8 border-t border-slate-200 pt-7">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">PROJECT HOMEPAGE</p>
                <h2 className="mt-1 text-lg font-bold text-slate-800">ข้อมูลหน้าหลักโครงการ</h2>
                <p className="mt-1 text-xs text-slate-400">
                  ข้อความ Hero รูปภาพ/วิดีโอสไลด์ และโบรชัวร์ โดยรูปสไลด์จะแสดงบนหน้ารายละเอียดโครงการ
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  คำพาดหัวหลัก (TH)
                  <Input
                    value={homepage.hero_title_th}
                    onChange={(event) => setHomepageField("hero_title_th", event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  คำพาดหัวหลัก (EN)
                  <Input
                    value={homepage.hero_title_en}
                    onChange={(event) => setHomepageField("hero_title_en", event.target.value)}
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  คำอธิบาย (TH)
                  <Textarea
                    value={homepage.hero_subtitle_th}
                    onChange={(event) => setHomepageField("hero_subtitle_th", event.target.value)}
                    className="min-h-24"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  คำอธิบาย (EN)
                  <Textarea
                    value={homepage.hero_subtitle_en}
                    onChange={(event) => setHomepageField("hero_subtitle_en", event.target.value)}
                    className="min-h-24"
                  />
                </label>
              </div>
              <div className="mt-6">
                <BannerMediaUpload
                  title="รูปภาพ/วิดีโอ banner หน้าโครงการ"
                  media={heroImages}
                  files={heroFiles}
                  onFilesChange={setHeroFiles}
                  onRemove={removeHero}
                  disabled={busy}
                />
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
                  <FileDropzone
                    title={brochureBusy ? "กำลังอัปโหลด..." : "ลากและวางโบรชัวร์ที่นี่"}
                    hint="PDF · ไม่เกิน 10 MB"
                    accept="application/pdf,.pdf"
                    disabled={brochureBusy}
                    fileName={brochure?.name}
                    className="min-h-28 min-w-64"
                    onFilesChange={(files) => void uploadBrochure(files[0])}
                  />
                </div>
              </div>
            </div>
          )}
          {isEditMode && (
            <div className="mt-8 border-t border-slate-200 pt-7">
              <ContactWidgetSettings scope="หน้าโครงการนี้" value={contact} onChange={setContact} />
            </div>
          )}
          {message && (
            <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm font-medium text-brand-primary">{message}</p>
          )}
          <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <button
              disabled={busy || (isEditMode && (!editingId || !contactReady))}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-text disabled:opacity-50"
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
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <i className="fa-solid fa-trash-can mr-2" />
                ลบโครงการ
              </button>
            )}
          </div>
        </form>
      </div>
    </>
  );
}
