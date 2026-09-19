"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable @next/next/no-html-link-for-pages */
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Section = "dashboard" | "homepage" | "house-types" | "facilities" | "promotions" | "news" | "contact" | "leads";
type Field = {
  key: string;
  label: string;
  type?: "text" | "number" | "textarea" | "select" | "datetime" | "checkbox";
  options?: [string, string][];
  required?: boolean;
};
type DataConfig = {
  resource: "house-types" | "facilities" | "promotions" | "news" | "leads";
  title: string;
  intro: string;
  fields: Field[];
  readOnlyCreate?: boolean;
};
const configs: Partial<Record<Section, DataConfig>> = {
  "house-types": {
    resource: "house-types",
    title: "จัดการแบบบ้าน (House Types)",
    intro: "เพิ่ม แก้ไข และแสดงแบบบ้านของโครงการนี้",
    fields: [
      { key: "name", label: "ชื่อแบบบ้าน", required: true },
      { key: "bedrooms", label: "ห้องนอน", type: "number" },
      { key: "bathrooms", label: "ห้องน้ำ", type: "number" },
      { key: "usable_area_sqm", label: "พื้นที่ใช้สอย (ตร.ม.)", type: "number" },
      { key: "starting_price", label: "ราคาเริ่มต้น (บาท)", type: "number" },
      { key: "description", label: "รายละเอียดแบบบ้าน", type: "textarea" },
    ],
  },
  facilities: {
    resource: "facilities",
    title: "จัดการสิ่งอำนวยความสะดวก",
    intro: "บันทึกไฮไลท์และส่วนกลางของโครงการนี้",
    fields: [
      { key: "name", label: "ชื่อสิ่งอำนวยความสะดวก", required: true },
      { key: "sort_order", label: "ลำดับ", type: "number" },
      { key: "description", label: "รายละเอียด", type: "textarea" },
    ],
  },
  promotions: {
    resource: "promotions",
    title: "จัดการข้อมูลโปรโมชั่น",
    intro: "กำหนดแคมเปญสำหรับโครงการนี้",
    fields: [
      { key: "title", label: "หัวข้อโปรโมชั่น", required: true },
      { key: "starts_at", label: "วันเริ่ม", type: "datetime" },
      { key: "ends_at", label: "วันสิ้นสุด", type: "datetime" },
      { key: "body", label: "รายละเอียด", type: "textarea" },
      { key: "is_published", label: "แสดงผลทันที", type: "checkbox" },
    ],
  },
  news: {
    resource: "news",
    title: "จัดการข้อมูลข่าวสาร",
    intro: "สร้างข่าวประชาสัมพันธ์หรือกิจกรรมของโครงการนี้",
    fields: [
      {
        key: "category",
        label: "หมวดหมู่",
        type: "select",
        required: true,
        options: [
          ["NEWS", "ข่าวประชาสัมพันธ์"],
          ["EVENT", "กิจกรรม"],
        ],
      },
      { key: "title", label: "หัวข้อข่าวสาร", required: true },
      { key: "published_at", label: "วันเผยแพร่", type: "datetime" },
      { key: "body", label: "เนื้อหาแบบย่อ", type: "textarea" },
      { key: "is_published", label: "เผยแพร่ข่าวสารนี้", type: "checkbox" },
    ],
  },
  leads: {
    resource: "leads",
    title: "รายชื่อผู้ลงทะเบียนรับสิทธิ์",
    intro: "ติดตามผลลูกค้าที่สนใจโครงการนี้",
    fields: [
      {
        key: "status",
        label: "สถานะติดตาม",
        type: "select",
        required: true,
        options: [
          ["NEW", "รอดำเนินการ"],
          ["CONTACTED", "ติดต่อแล้ว"],
          ["QUALIFIED", "มีโอกาสปิดการขาย"],
          ["CLOSED", "ปิดการขาย"],
        ],
      },
    ],
    readOnlyCreate: true,
  },
};
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
const settingFields: Record<"homepage" | "contact", Field[]> = {
  homepage: [
    { key: "hero_title_th", label: "คำพาดหัวหลัก - ภาษาไทย" },
    { key: "hero_title_en", label: "คำพาดหัวหลัก - ภาษาอังกฤษ" },
    { key: "hero_subtitle_th", label: "คำอธิบายเพิ่มเติม - ภาษาไทย", type: "textarea" },
    { key: "hero_subtitle_en", label: "คำอธิบายเพิ่มเติม - ภาษาอังกฤษ", type: "textarea" },
  ],
  contact: [
    { key: "phone", label: "เบอร์โทรศัพท์โครงการ" },
    { key: "email", label: "อีเมลโครงการ" },
    { key: "map_url", label: "Google Maps URL หรือ Embed", type: "text" },
    { key: "nearby_places_th", label: "สถานที่ใกล้เคียง - ภาษาไทย", type: "textarea" },
    { key: "nearby_places_en", label: "Nearby Places - English", type: "textarea" },
  ],
};
function empty(fields: Field[]) {
  return Object.fromEntries(fields.map((field) => [field.key, field.type === "checkbox" ? false : ""]));
}
function valueForInput(field: Field, value: unknown) {
  if (field.type === "datetime" && value) {
    const date = new Date(String(value));
    return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 16);
  }
  return value ?? (field.type === "checkbox" ? false : "");
}

export function ProjectWorkspace({
  projectId,
  projectName,
  section,
}: {
  projectId: string;
  projectName: string;
  section: Section;
}) {
  const dataConfig = configs[section];
  const settingMode = section === "homepage" || section === "contact";
  const fields = useMemo(
    () => (settingMode ? settingFields[section] : (dataConfig?.fields ?? [])),
    [dataConfig, section, settingMode],
  );
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(() => empty(fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroImages, setHeroImages] = useState<{ id: string; name: string; mimeType: string; url: string }[]>([]);
  const [houseTypeImage, setHouseTypeImage] = useState<File | null>(null);
  const [existingHouseTypeImage, setExistingHouseTypeImage] = useState<string | null>(null);
  const [stats, setStats] = useState({ leads: 0, homes: 0, promos: 0, news: 0 });
  const load = useCallback(async () => {
    if (section === "dashboard") {
      const results = await Promise.all(
        ["leads", "house-types", "promotions", "news"].map((resource) =>
          fetch(`/api/admin/${resource}`).then((response) => (response.ok ? response.json() : { rows: [] })),
        ),
      );
      setStats({
        leads: results[0].rows.filter((row: Record<string, unknown>) => row.project_id === projectId).length,
        homes: results[1].rows.filter((row: Record<string, unknown>) => row.project_id === projectId).length,
        promos: results[2].rows.filter((row: Record<string, unknown>) => row.project_id === projectId).length,
        news: results[3].rows.filter((row: Record<string, unknown>) => row.project_id === projectId).length,
      });
      return;
    }
    if (settingMode) {
      const response = await fetch(`/api/admin/project-settings?projectId=${projectId}`);
      const data = await response.json();
      setForm(Object.fromEntries(fields.map((field) => [field.key, valueForInput(field, data.settings?.[field.key])])));
      return;
    }
    const response = await fetch(`/api/admin/${dataConfig?.resource}`);
    const data = await response.json();
    setRows((data.rows ?? []).filter((row: Record<string, unknown>) => row.project_id === projectId));
  }, [dataConfig?.resource, fields, projectId, section, settingMode]);
  // The requested records are retrieved asynchronously when the selected menu changes.
  useEffect(() => {
    void load();
  }, [load]);
  // Existing banner images are loaded so an admin can review and remove them during editing.
  useEffect(() => {
    if (section === "homepage")
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&list=1`)
        .then((response) => (response.ok ? response.json() : { rows: [] }))
        .then((data) => setHeroImages(data.rows ?? []))
        .catch(() => undefined);
  }, [projectId, section]);
  const setField = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    if (settingMode) {
      try {
        const response = await fetch("/api/admin/project-settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, project_id: projectId }),
        });
        const result = await response.json();
        if (!response.ok) {
          setMessage(result.message ?? "บันทึกไม่สำเร็จ");
          return;
        }
        setMessage("บันทึกข้อมูลติดต่อและแผนที่เรียบร้อย");
        await load();
      } catch {
        setMessage("ไม่สามารถเชื่อมต่อระบบบันทึกข้อมูลได้ กรุณาลองอีกครั้ง");
      } finally {
        setBusy(false);
      }
      return;
    }
    let response: Response;
    response = await fetch(`/api/admin/${dataConfig?.resource}`, {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        editingId ? { ...form, id: editingId, project_id: projectId } : { ...form, project_id: projectId },
      ),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.message ?? "บันทึกไม่สำเร็จ");
      setBusy(false);
      return;
    }
    const savedId = editingId ?? String(result.id ?? "");
    if (section === "house-types" && houseTypeImage && savedId) {
      const upload = new FormData();
      upload.set("entityType", "house-types");
      upload.set("entityId", savedId);
      upload.set("mediaKind", "cover");
      upload.set("file", houseTypeImage);
      const imageResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
      if (!imageResponse.ok) {
        const imageResult = await imageResponse.json();
        setMessage(imageResult.message ?? "บันทึกแบบบ้านแล้ว แต่อัปโหลดรูปไม่สำเร็จ");
        setBusy(false);
        return;
      }
    }
    setMessage("บันทึกข้อมูลเรียบร้อย");
    setBusy(false);
    setHouseTypeImage(null);
    setExistingHouseTypeImage(null);
    if (!settingMode) {
      setEditingId(null);
      setForm(empty(fields));
    }
    await load();
  };
  const saveHomepage = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    const settingsResponse = await fetch("/api/admin/project-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, project_id: projectId }),
    });
    if (!settingsResponse.ok) {
      const result = await settingsResponse.json();
      setMessage(result.message ?? "บันทึกไม่สำเร็จ");
      setBusy(false);
      return;
    }
    for (const heroFile of heroFiles) {
      const upload = new FormData();
      upload.set("entityType", "projects");
      upload.set("entityId", projectId);
      upload.set("mediaKind", "hero");
      upload.set("file", heroFile);
      const imageResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
      if (!imageResponse.ok) {
        const result = await imageResponse.json();
        setMessage(result.message ?? "บันทึกข้อความแล้ว แต่ยังอัปโหลดไฟล์ Hero ไม่สำเร็จ");
        setBusy(false);
        return;
      }
    }
    setHeroFiles([]);
    setMessage("บันทึกข้อมูลหน้าหลักเรียบร้อย");
    setBusy(false);
    await load();
    const images = await fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&list=1`).then(
      (response) => response.json(),
    );
    setHeroImages(images.rows ?? []);
  };
  const removeHero = async (id: string) => {
    if (!confirm("ต้องการลบไฟล์ Hero นี้ใช่หรือไม่")) return;
    const response = await fetch(
      `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&mediaId=${id}`,
      { method: "DELETE" },
    );
    if (response.ok) setHeroImages((items) => items.filter((item) => item.id !== id));
  };
  const edit = async (row: Record<string, unknown>) => {
    setEditingId(String(row.id));
    setForm(
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          field.type === "checkbox" ? Boolean(row[field.key]) : valueForInput(field, row[field.key]),
        ]),
      ),
    );
    setHouseTypeImage(null);
    if (section === "house-types") {
      const response = await fetch(`/api/admin/media?entityType=house-types&entityId=${row.id}&mediaKind=cover&list=1`);
      const data = response.ok ? await response.json() : { rows: [] };
      setExistingHouseTypeImage(data.rows?.[0]?.url ?? null);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  if (section === "dashboard")
    return (
      <>
        <header className="border-b border-slate-200 pb-5">
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-500">DASHBOARD HP</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{projectName}</h1>
          <p className="mt-1 text-sm text-slate-500">ภาพรวมข้อมูลเฉพาะโครงการ</p>
        </header>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["ผู้ลงทะเบียน", stats.leads, "fa-user-pen", "text-emerald-700"],
            ["แบบบ้าน", stats.homes, "fa-house", "text-indigo-700"],
            ["โปรโมชั่น", stats.promos, "fa-tags", "text-purple-700"],
            ["ข่าวสาร", stats.news, "fa-newspaper", "text-amber-700"],
          ].map(([label, count, icon, color]) => (
            <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <i className={`fa-solid ${icon} ${color} text-xl`} />
              <p className="mt-4 text-sm text-slate-500">{label}</p>
              <p className={`mt-1 text-3xl font-bold ${color}`}>{count}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          <i className="fa-solid fa-chart-column mr-2 text-indigo-500" />
          ข้อมูล Dashboard HP จะเปลี่ยนตามข้อมูลแบบบ้าน โปรโมชั่น ข่าวสาร และ Leads ของโครงการนี้
        </div>
      </>
    );
  if (section === "homepage")
    return (
      <>
        <header className="border-b border-slate-200 pb-5">
          <h1 className="text-xl font-bold text-slate-800">จัดการข้อมูลหน้าหลักโครงการ (Manage Homepage Details)</h1>
        </header>
        <form onSubmit={saveHomepage} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-5 md:grid-cols-2">
            {fields.map((field) => (
              <label key={field.key} className="text-sm font-bold text-slate-700">
                {field.label} ({field.key.includes("title") ? "Main Headline" : "Sub-headline"} -{" "}
                {field.key.endsWith("th") ? "TH" : "EN"})
                {field.type === "textarea" ? (
                  <textarea
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                    className={`${inputClass} min-h-20`}
                  />
                ) : (
                  <input
                    value={String(form[field.key] ?? "")}
                    onChange={(event) => setField(field.key, event.target.value)}
                    className={inputClass}
                  />
                )}
              </label>
            ))}
          </div>
          <div className="mt-6">
            <p className="text-sm font-bold text-slate-700">รูปภาพหรือวิดีโอสไลด์แบนเนอร์หลัก (Hero Banner Media)</p>
            <label className="mt-2 flex min-h-22 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-400 hover:border-indigo-400 hover:bg-indigo-50">
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                className="sr-only"
                onChange={(event) => setHeroFiles(Array.from(event.target.files ?? []))}
              />
              <span>
                <i className="fa-solid fa-photo-film mr-2 text-2xl align-middle text-slate-400" />
                {heroFiles.length
                  ? `เลือกแล้ว ${heroFiles.length} ไฟล์`
                  : "คลิกเพื่อเลือกหลายไฟล์ หรือลากรูปภาพ/วิดีโอมาวางที่นี่"}
              </span>
            </label>
            <p className="mt-2 text-xs text-slate-400">
              รองรับ JPG, PNG, WEBP ไม่เกิน 5 MB และ MP4, WEBM ไม่เกิน 50 MB ต่อไฟล์
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {heroImages.map((image) => (
                <div key={image.id} className="relative overflow-hidden rounded-lg border">
                  {image.mimeType.startsWith("video/") ? (
                    <video src={image.url} className="h-24 w-full object-cover" muted playsInline preload="metadata" />
                  ) : (
                    <img src={image.url} alt={image.name} className="h-24 w-full object-cover" />
                  )}
                  <button
                    type="button"
                    onClick={() => void removeHero(image.id)}
                    className="absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-rose-600 text-xs text-white"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          {message && <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{message}</p>}
          <button
            disabled={busy}
            className="mt-5 rounded-lg bg-[#5237ff] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก..." : "บันทึกข้อมูลหน้าหลักโครงการ"}
          </button>
        </form>
      </>
    );
  const title = settingMode ? "จัดการข้อมูลติดต่อ & แผนที่" : (dataConfig?.title ?? "");
  const intro = settingMode ? "ตั้งค่าเบอร์โทร อีเมล แผนที่ และสถานที่ใกล้เคียง" : (dataConfig?.intro ?? "");
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-indigo-500">{projectName}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{intro}</p>
        </div>
        {section === "leads" && (
          <a
            href="/api/admin/leads?format=csv"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            <i className="fa-solid fa-file-csv mr-2" />
            Export CSV
          </a>
        )}
      </header>
      <div className={`mt-6 grid gap-6 ${settingMode ? "" : "xl:grid-cols-[minmax(0,1fr)_22rem]"}`}>
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="border-b border-slate-100 pb-4 text-base font-bold text-slate-800">
            {editingId
              ? "แก้ไขข้อมูล"
              : settingMode
                ? "ตั้งค่าข้อมูล"
                : dataConfig?.readOnlyCreate
                  ? "บันทึกสถานะ Lead"
                  : "เพิ่มข้อมูล"}
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.key}
                className={`text-sm font-semibold text-slate-700 ${field.type === "textarea" ? "md:col-span-2" : ""}`}
              >
                {field.type === "checkbox" ? (
                  <span className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={Boolean(form[field.key])}
                      onChange={(event) => setField(field.key, event.target.checked)}
                      className="size-4 accent-indigo-600"
                    />
                    {field.label}
                  </span>
                ) : (
                  <>
                    {field.label}
                    {field.required && <span className="ml-1 text-rose-500">*</span>}
                    {field.type === "textarea" ? (
                      <textarea
                        value={String(form[field.key] ?? "")}
                        onChange={(event) => setField(field.key, event.target.value)}
                        className={`${inputClass} min-h-28`}
                      />
                    ) : field.type === "select" ? (
                      <select
                        required={field.required}
                        value={String(form[field.key] ?? "")}
                        onChange={(event) => setField(field.key, event.target.value)}
                        className={inputClass}
                      >
                        {field.options?.map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        required={field.required}
                        type={field.type === "datetime" ? "datetime-local" : (field.type ?? "text")}
                        value={String(form[field.key] ?? "")}
                        onChange={(event) => setField(field.key, event.target.value)}
                        className={inputClass}
                      />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>
          {section === "house-types" && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">รูปแบบบ้าน</p>
              <label className="mt-2 flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400 hover:border-indigo-400 hover:bg-indigo-50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => setHouseTypeImage(event.target.files?.[0] ?? null)}
                />
                {existingHouseTypeImage && !houseTypeImage ? (
                  <img src={existingHouseTypeImage} alt="รูปแบบบ้านปัจจุบัน" className="h-32 w-full object-cover" />
                ) : (
                  <span>
                    <i className="fa-solid fa-image mr-2 text-xl text-indigo-500" />
                    {houseTypeImage ? houseTypeImage.name : "คลิกเพื่อเพิ่มหรือเปลี่ยนรูปแบบบ้าน"}
                  </span>
                )}
              </label>
              <p className="mt-2 text-xs text-slate-400">รองรับ JPG, PNG และ WEBP ขนาดไม่เกิน 5 MB</p>
            </div>
          )}
          {message && <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">{message}</p>}
          <div className="mt-5 flex gap-3">
            <button
              disabled={busy}
              className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
            >
              <i className="fa-solid fa-floppy-disk mr-2" />
              {busy ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(empty(fields));
                  setHouseTypeImage(null);
                  setExistingHouseTypeImage(null);
                }}
                className="text-sm font-semibold text-slate-500"
              >
                ยกเลิก
              </button>
            )}
          </div>
        </form>
        {!settingMode && (
          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-base font-bold text-slate-800">รายการของโครงการ</h2>
            <div className="mt-3 space-y-2">
              {rows.map((row) => (
                <button
                  type="button"
                  key={String(row.id)}
                  onClick={() => void edit(row)}
                  className="w-full rounded-xl border border-slate-100 p-3 text-left hover:border-indigo-200 hover:bg-indigo-50"
                >
                  <p className="font-bold text-slate-700">
                    {String(row.name ?? row.title ?? row.phone ?? "รายการข้อมูล")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">{String(row.status ?? row.category ?? "กดเพื่อแก้ไข")}</p>
                </button>
              ))}
              {!rows.length && <p className="py-8 text-center text-sm text-slate-400">ยังไม่มีข้อมูล</p>}
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
