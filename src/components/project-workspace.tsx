"use client";
/* eslint-disable @next/next/no-img-element */
/* eslint-disable react-hooks/set-state-in-effect */

import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { coordinatesFromGoogleMaps } from "@/lib/map-coordinates";

type Section =
  "dashboard" | "homepage" | "house-types" | "facilities" | "promotions" | "news" | "contact" | "after-sales" | "leads";
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
  columns?: [string, string][];
  readOnlyCreate?: boolean;
};
type Brochure = { id: string; name: string; url: string };
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
    columns: [
      ["name", "ชื่อแบบบ้าน"],
      ["bedrooms", "ห้องนอน"],
      ["bathrooms", "ห้องน้ำ"],
      ["usable_area_sqm", "พื้นที่ใช้สอย"],
      ["starting_price", "ราคาเริ่มต้น"],
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
    columns: [
      ["sort_order", "ลำดับ"],
      ["name", "สิ่งอำนวยความสะดวก"],
      ["description", "รายละเอียด"],
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
    columns: [
      ["title", "หัวข้อโปรโมชั่น"],
      ["starts_at", "วันเริ่ม"],
      ["ends_at", "วันสิ้นสุด"],
      ["is_published", "สถานะ"],
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
    columns: [
      ["category", "หมวดหมู่"],
      ["title", "หัวข้อข่าวสาร"],
      ["published_at", "วันเผยแพร่"],
      ["is_published", "สถานะ"],
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
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-soft";
const settingFields: Record<"homepage" | "contact" | "after-sales", Field[]> = {
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
    { key: "virtual_tour_url", label: "ลิงก์ Map 3D / Virtual Tour", type: "text" },
    { key: "latitude", label: "ละติจูด (Latitude)", type: "number" },
    { key: "longitude", label: "ลองจิจูด (Longitude)", type: "number" },
    { key: "nearby_places_th", label: "สถานที่ใกล้เคียง - ภาษาไทย", type: "textarea" },
    { key: "nearby_places_en", label: "Nearby Places - English", type: "textarea" },
  ],
  "after-sales": [
    { key: "care_warranty", label: "การรับประกันหลังขาย", type: "textarea" },
    { key: "care_maintenance", label: "คู่มือการอยู่อาศัย", type: "textarea" },
    { key: "care_common_area", label: "นิติบุคคล & พื้นที่ส่วนกลาง", type: "textarea" },
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

function tableValue(field: string, value: unknown) {
  if (field === "is_published") return value === true || value === 1 ? "เผยแพร่" : "แบบร่าง";
  if (field === "category") return value === "EVENT" ? "กิจกรรม" : "ข่าวสาร";
  if (field === "starting_price")
    return value === null || value === "" ? "สอบถามราคา" : `${Number(value).toLocaleString("th-TH")} บาท`;
  if (field === "usable_area_sqm") return value ? `${Number(value).toLocaleString("th-TH")} ตร.ม.` : "-";
  if (field.endsWith("_at")) return value ? leadDate(value) : "-";
  return value === null || value === "" || value === undefined ? "-" : String(value);
}

const leadStatus: Record<string, { label: string; className: string }> = {
  NEW: { label: "รอดำเนินการ", className: "bg-amber-100 text-amber-800" },
  CONTACTED: { label: "ติดต่อแล้ว", className: "bg-emerald-100 text-emerald-700" },
  QUALIFIED: { label: "มีโอกาสปิดการขาย", className: "bg-blue-100 text-blue-700" },
  CLOSED: { label: "ปิดการขาย", className: "bg-slate-200 text-slate-700" },
};

function leadDate(value: unknown, includeTime = false) {
  if (!value) return "-";
  const date = new Date(String(value));
  if (Number.isNaN(date.valueOf())) return String(value);
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function ProjectWorkspace({
  projectId,
  projectName,
  section,
  embedded = false,
}: {
  projectId: string;
  projectName: string;
  section: Section;
  embedded?: boolean;
}) {
  const dataConfig = configs[section];
  const settingMode = section === "homepage" || section === "contact" || section === "after-sales";
  const fields = useMemo(
    () => (settingMode ? settingFields[section] : (dataConfig?.fields ?? [])),
    [dataConfig, section, settingMode],
  );
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(() => empty(fields));
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [heroFiles, setHeroFiles] = useState<File[]>([]);
  const [heroImages, setHeroImages] = useState<{ id: string; name: string; mimeType: string; url: string }[]>([]);
  const [brochure, setBrochure] = useState<Brochure | null>(null);
  const [brochureBusy, setBrochureBusy] = useState(false);
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
    if (section === "homepage") {
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=hero&list=1`)
        .then((response) => (response.ok ? response.json() : { rows: [] }))
        .then((data) => setHeroImages(data.rows ?? []))
        .catch(() => undefined);
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=brochure&list=1`)
        .then((response) => (response.ok ? response.json() : { rows: [] }))
        .then((data) => setBrochure(data.rows?.[0] ?? null))
        .catch(() => undefined);
    }
  }, [projectId, section]);
  const setField = (key: string, value: unknown) => setForm((current) => ({ ...current, [key]: value }));
  const setMapUrl = (value: string) => {
    const coordinates = coordinatesFromGoogleMaps(value);
    setForm((current) => ({
      ...current,
      map_url: value,
      ...(coordinates ? { latitude: String(coordinates.latitude), longitude: String(coordinates.longitude) } : {}),
    }));
  };
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
        setMessage(
          section === "after-sales"
            ? "บันทึกข้อมูลบริการหลังการขายเรียบร้อย"
            : section === "homepage"
              ? "บันทึกข้อมูลหน้าหลักโครงการเรียบร้อย"
              : "บันทึกข้อมูลติดต่อและแผนที่เรียบร้อย",
        );
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
      setEditorOpen(false);
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
  const uploadBrochure = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBrochureBusy(true);
    setMessage("");
    const upload = new FormData();
    upload.set("entityType", "projects");
    upload.set("entityId", projectId);
    upload.set("mediaKind", "brochure");
    upload.set("file", file);
    const response = await fetch("/api/admin/media", { method: "POST", body: upload });
    const result = await response.json();
    setBrochureBusy(false);
    event.target.value = "";
    if (!response.ok) {
      setMessage(result.message ?? "อัปโหลดโบรชัวร์ไม่สำเร็จ");
      return;
    }
    const brochureResponse = await fetch(
      `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=brochure&list=1`,
    );
    const brochureData = brochureResponse.ok ? await brochureResponse.json() : { rows: [] };
    setBrochure(brochureData.rows?.[0] ?? null);
    setMessage("อัปโหลดโบรชัวร์เรียบร้อย");
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
    setEditorOpen(true);
  };
  const startCreate = () => {
    setEditingId(null);
    setForm(empty(fields));
    setHouseTypeImage(null);
    setExistingHouseTypeImage(null);
    setMessage("");
    setEditorOpen(true);
  };
  const closeEditor = () => {
    if (busy) return;
    setEditorOpen(false);
    setEditingId(null);
    setForm(empty(fields));
    setHouseTypeImage(null);
    setExistingHouseTypeImage(null);
  };
  const updateLeadStatus = async (id: string, status: string) => {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const result = await response.json();
      if (!response.ok) {
        setMessage(result.message ?? "บันทึกสถานะไม่สำเร็จ");
        return;
      }
      setRows((current) => current.map((row) => (String(row.id) === id ? { ...row, status } : row)));
      setMessage("บันทึกสถานะติดตามเรียบร้อย");
    } catch {
      setMessage("ไม่สามารถเชื่อมต่อระบบบันทึกสถานะได้");
    } finally {
      setBusy(false);
    }
  };
  if (section === "dashboard")
    return (
      <>
        <header className="border-b border-slate-200 pb-5">
          <p className="inline-flex rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-bold tracking-[0.16em] text-brand-primary">
            DASHBOARD HP
          </p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{projectName}</h1>
          <p className="mt-1 text-sm text-slate-500">ภาพรวมข้อมูลเฉพาะโครงการ</p>
        </header>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["ผู้ลงทะเบียน", stats.leads, "fa-user-pen", "text-emerald-700"],
            ["แบบบ้าน", stats.homes, "fa-house", "text-brand-primary"],
            ["โปรโมชั่น", stats.promos, "fa-tags", "text-brand-primary"],
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
          <i className="fa-solid fa-chart-column mr-2 text-brand-primary" />
          ข้อมูล Dashboard HP จะเปลี่ยนตามข้อมูลแบบบ้าน โปรโมชั่น ข่าวสาร และ Leads ของโครงการนี้
        </div>
      </>
    );
  if (section === "homepage")
    return (
      <section id="homepage-content" className={embedded ? "mt-8 border-t border-slate-200 pt-8" : ""}>
        <header className="border-b border-slate-200 pb-5">
          {embedded ? (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-primary">PROJECT HOMEPAGE</p>
              <h2 className="mt-1 text-xl font-bold text-slate-800">จัดการข้อมูลหน้าหลักโครงการ</h2>
              <p className="mt-1 text-sm text-slate-500">ข้อความ Hero สไลด์รูปภาพ/วิดีโอ และโบรชัวร์ของโครงการนี้</p>
            </>
          ) : (
            <h1 className="text-xl font-bold text-slate-800">จัดการข้อมูลหน้าหลักโครงการ (Manage Homepage Details)</h1>
          )}
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
            <label className="mt-2 flex min-h-22 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 text-center text-sm font-semibold text-slate-400 hover:border-brand-primary hover:bg-brand-soft">
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
                      <i className="fa-solid fa-arrow-up-right-from-square mr-1" />
                      {brochure.name}
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-slate-500">ยังไม่มีไฟล์โบรชัวร์</p>
                  )}
                </div>
              </div>
              <label className="cursor-pointer rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-text">
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
            <p className="mt-3 text-xs text-slate-500">รองรับไฟล์ PDF ขนาดไม่เกิน 20 MB</p>
          </div>
          {message && <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-primary">{message}</p>}
          <button
            disabled={busy}
            className="mt-5 rounded-lg bg-brand-primary px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
          >
            {busy ? "กำลังบันทึก..." : "บันทึกข้อมูลหน้าหลักโครงการ"}
          </button>
        </form>
      </section>
    );
  const title =
    section === "after-sales"
      ? "บริการหลังการขาย (Mida Care)"
      : settingMode
        ? "จัดการข้อมูลติดต่อ & แผนที่"
        : (dataConfig?.title ?? "");
  const intro =
    section === "after-sales"
      ? "แก้ไขข้อมูลบริการที่จะแสดงเป็นปุ่มบนหน้าโครงการ"
      : settingMode
        ? "ตั้งค่าเบอร์โทร อีเมล แผนที่ และสถานที่ใกล้เคียง"
        : (dataConfig?.intro ?? "");
  if (section === "leads")
    return (
      <>
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-brand-primary">{projectName}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-800">รายชื่อผู้ลงทะเบียนสนใจโครงการ (Customer Leads)</h1>
            <p className="mt-1 text-sm text-slate-500">ข้อมูลสำคัญจากแบบฟอร์มรับข้อเสนอพิเศษของโครงการนี้</p>
          </div>
          <a
            href={`/api/admin/leads?format=csv&projectId=${projectId}`}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white"
          >
            <i className="fa-solid fa-file-csv mr-2" />
            ส่งออกข้อมูลลูกค้า (CSV)
          </a>
        </header>
        {message && <p className="mt-5 rounded-lg bg-brand-soft px-4 py-3 text-sm text-brand-primary">{message}</p>}
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-[1180px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-4 py-4">วันที่/เวลา</th>
                  <th className="px-4 py-4">ชื่อและช่องทางติดต่อ</th>
                  <th className="px-4 py-4">ที่อยู่ปัจจุบัน</th>
                  <th className="px-4 py-4">ข้อมูลความสนใจ</th>
                  <th className="px-4 py-4">เวลาที่สะดวก</th>
                  <th className="px-4 py-4">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {rows.map((row) => {
                  const status = leadStatus[String(row.status)] ?? leadStatus.NEW;
                  return (
                    <tr key={String(row.id)} className="align-top hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-4 py-4 text-xs">{leadDate(row.created_at, true)}</td>
                      <td className="px-4 py-4">
                        <p className="font-bold text-slate-800">{String(row.name ?? "-")}</p>
                        <p className="mt-1 text-xs">
                          <i className="fa-solid fa-phone mr-1" />
                          {String(row.phone ?? "-")}
                        </p>
                        <p className="mt-1 text-xs">
                          <i className="fa-solid fa-envelope mr-1" />
                          {String(row.email ?? "-")}
                        </p>
                      </td>
                      <td className="max-w-56 px-4 py-4 text-xs leading-5">
                        {[row.subdistrict, row.district, row.province].filter(Boolean).join(" · ") || "-"}
                      </td>
                      <td className="px-4 py-4 text-xs leading-5">
                        <p>
                          <b>งบ:</b> {String(row.budget ?? "-")}
                        </p>
                        <p>
                          <b>สมาชิก:</b> {String(row.family_members ?? "-")} คน
                        </p>
                        <p>
                          <b>ที่พัก:</b> {String(row.residence_type ?? "-")}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-xs leading-5">
                        <p>{leadDate(row.preferred_contact_date)}</p>
                        <p>{String(row.preferred_contact_time ?? "-").slice(0, 5)} น.</p>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={String(row.status ?? "NEW")}
                          disabled={busy}
                          onChange={(event) => void updateLeadStatus(String(row.id), event.target.value)}
                          aria-label={`สถานะของ ${String(row.name ?? "Lead")}`}
                          className={`rounded-lg border-0 px-3 py-2 text-xs font-bold outline-none ring-1 ring-inset ring-black/5 disabled:opacity-60 ${status.className}`}
                        >
                          {configs.leads?.fields[0].options?.map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                      ยังไม่มีผู้ลงทะเบียนในโครงการนี้
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  if (!settingMode && dataConfig)
    return (
      <>
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-brand-primary">{projectName}</p>
            <h1 className="mt-1 text-xl font-bold text-slate-800">{dataConfig.title}</h1>
            <p className="mt-1 text-sm text-slate-500">{dataConfig.intro}</p>
          </div>
          <button
            type="button"
            onClick={startCreate}
            className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-text"
          >
            <i className="fa-solid fa-circle-plus mr-2" />
            เพิ่มข้อมูลใหม่
          </button>
        </header>

        {message && (
          <p className="mt-5 rounded-lg border border-brand-primary/10 bg-brand-soft px-4 py-3 text-sm font-semibold text-brand-primary">
            {message}
          </p>
        )}

        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-800">รายการข้อมูล</h2>
              <p className="mt-1 text-xs text-slate-400">ทั้งหมด {rows.length.toLocaleString("th-TH")} รายการ</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-220 text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600">
                <tr>
                  {dataConfig.columns?.map(([, label]) => (
                    <th key={label} className="px-4 py-4">
                      {label}
                    </th>
                  ))}
                  <th className="px-4 py-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {rows.map((row) => (
                  <tr key={String(row.id)} className="align-top transition hover:bg-slate-50/80">
                    {dataConfig.columns?.map(([field]) => (
                      <td key={field} className="max-w-88 px-4 py-4">
                        {field === "is_published" || field === "category" ? (
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                              field === "is_published"
                                ? row[field] === true || row[field] === 1
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-slate-100 text-slate-500"
                                : row[field] === "EVENT"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-brand-soft text-brand-primary"
                            }`}
                          >
                            {tableValue(field, row[field])}
                          </span>
                        ) : (
                          <span className={field === "name" || field === "title" ? "font-bold text-slate-800" : ""}>
                            {tableValue(field, row[field])}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => void edit(row)}
                        className="rounded-lg border border-brand-primary/20 px-3 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-soft"
                      >
                        <i className="fa-solid fa-pen-to-square mr-1.5" />
                        แก้ไข
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td
                      colSpan={(dataConfig.columns?.length ?? 0) + 1}
                      className="px-4 py-16 text-center text-slate-400"
                    >
                      <i className="fa-regular fa-folder-open mb-3 block text-3xl" />
                      ยังไม่มีข้อมูล กด “เพิ่มข้อมูลใหม่” เพื่อเริ่มต้น
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {editorOpen && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-brand-overlay/65 p-4 backdrop-blur-sm">
            <form
              onSubmit={save}
              role="dialog"
              aria-modal="true"
              aria-label={editingId ? `แก้ไข ${dataConfig.title}` : `เพิ่ม ${dataConfig.title}`}
              className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 md:px-6">
                <div>
                  <p className="text-xs font-bold tracking-widest text-brand-primary">{projectName}</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-800">
                    {editingId ? "แก้ไขข้อมูล" : "เพิ่มข้อมูลใหม่"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeEditor}
                  aria-label="ปิดหน้าต่าง"
                  className="grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto px-5 py-5 md:px-6">
                <div className="grid gap-4 md:grid-cols-2">
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
                            className="size-4 accent-brand-primary"
                          />
                          {field.label}
                        </span>
                      ) : (
                        <>
                          {field.label}
                          {field.required && <span className="ml-1 text-rose-500">*</span>}
                          {field.type === "textarea" ? (
                            <textarea
                              required={field.required}
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
                    <label className="mt-2 flex min-h-32 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400 hover:border-brand-primary hover:bg-brand-soft">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="sr-only"
                        onChange={(event) => setHouseTypeImage(event.target.files?.[0] ?? null)}
                      />
                      {existingHouseTypeImage && !houseTypeImage ? (
                        <img
                          src={existingHouseTypeImage}
                          alt="รูปแบบบ้านปัจจุบัน"
                          className="h-40 w-full object-cover"
                        />
                      ) : (
                        <span>
                          <i className="fa-solid fa-image mr-2 text-xl text-brand-primary" />
                          {houseTypeImage ? houseTypeImage.name : "คลิกเพื่อเพิ่มหรือเปลี่ยนรูปแบบบ้าน"}
                        </span>
                      )}
                    </label>
                    <p className="mt-2 text-xs text-slate-400">รองรับ JPG, PNG และ WEBP ขนาดไม่เกิน 5 MB</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 px-5 py-4 md:px-6">
                <button
                  type="button"
                  onClick={closeEditor}
                  className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  ยกเลิก
                </button>
                <button
                  disabled={busy}
                  className="rounded-lg bg-brand-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-text disabled:opacity-50"
                >
                  <i className="fa-solid fa-floppy-disk mr-2" />
                  {busy ? "กำลังบันทึก..." : editingId ? "บันทึกการแก้ไข" : "เพิ่มข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        )}
      </>
    );
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand-primary">{projectName}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{intro}</p>
        </div>
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
                      className="size-4 accent-brand-primary"
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
                        onChange={(event) =>
                          field.key === "map_url"
                            ? setMapUrl(event.target.value)
                            : setField(field.key, event.target.value)
                        }
                        className={inputClass}
                      />
                    )}
                  </>
                )}
              </label>
            ))}
          </div>
          {section === "contact" && (
            <p className="mt-3 rounded-lg bg-brand-soft px-3 py-2 text-xs leading-5 text-brand-primary">
              <i className="fa-solid fa-location-dot mr-2" />
              วาง Google Maps URL หรือโค้ด Embed แล้วระบบจะเติม Latitude และ Longitude อัตโนมัติ สำหรับลิงก์ย่อ
              maps.app.goo.gl ระบบจะดึงพิกัดเมื่อกดบันทึก
            </p>
          )}
          {section === "house-types" && (
            <div className="mt-5">
              <p className="text-sm font-semibold text-slate-700">รูปแบบบ้าน</p>
              <label className="mt-2 flex min-h-28 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm font-semibold text-slate-400 hover:border-brand-primary hover:bg-brand-soft">
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
                    <i className="fa-solid fa-image mr-2 text-xl text-brand-primary" />
                    {houseTypeImage ? houseTypeImage.name : "คลิกเพื่อเพิ่มหรือเปลี่ยนรูปแบบบ้าน"}
                  </span>
                )}
              </label>
              <p className="mt-2 text-xs text-slate-400">รองรับ JPG, PNG และ WEBP ขนาดไม่เกิน 5 MB</p>
            </div>
          )}
          {message && <p className="mt-4 rounded-lg bg-brand-soft px-3 py-2 text-sm text-brand-primary">{message}</p>}
          <div className="mt-5 flex gap-3">
            <button
              disabled={busy}
              className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
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
                  className="w-full rounded-xl border border-slate-100 p-3 text-left hover:border-brand-primary/20 hover:bg-brand-soft"
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
