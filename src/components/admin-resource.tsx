"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { AdminResource } from "@/lib/admin-resources";

type Field = {
  name: string;
  label: string;
  hint?: string;
  type?: "text" | "number" | "textarea" | "select" | "checkbox" | "datetime" | "project" | "password";
  options?: [string, string][];
  required?: boolean;
  wide?: boolean;
};
type Config = {
  eyebrow: string;
  title: string;
  intro: string;
  formTitle: string;
  fields: Field[];
  columns: [string, string][];
  canCreate?: boolean;
  exportUrl?: string;
};

const configs: Record<AdminResource, Config> = {
  projects: {
    eyebrow: "MIDA PROPERTY",
    title: "จัดการโครงการ",
    intro: "สร้างโครงการใหม่และดูแลข้อมูลที่แสดงบนเว็บไซต์",
    formTitle: "เพิ่ม / แก้ไขโครงการ",
    fields: [
      { name: "name_th", label: "ชื่อโครงการ (ภาษาไทย)", required: true },
      { name: "name_en", label: "ชื่อโครงการ (ภาษาอังกฤษ)" },
      { name: "slug", label: "Slug สำหรับ URL", hint: "เช่น grand-village-petchkasem", required: true },
      { name: "location", label: "ทำเล / จังหวัด", required: true },
      {
        name: "property_type",
        label: "ประเภทโครงการหลัก",
        type: "select",
        required: true,
        options: [
          ["DETACHED_HOUSE", "บ้านเดี่ยว"],
          ["SEMI_DETACHED", "บ้านแฝด"],
          ["TOWNHOME", "ทาวน์โฮม"],
          ["COMMERCIAL", "อาคารพาณิชย์"],
        ],
      },
      { name: "starting_price", label: "ราคาเริ่มต้น (บาท)", type: "number" },
      {
        name: "status",
        label: "สถานะการแสดงผล",
        type: "select",
        required: true,
        options: [
          ["READY", "พร้อมอยู่ / เปิดขาย"],
          ["CONSTRUCTION", "กำลังก่อสร้าง"],
          ["ARCHIVED", "เก็บถาวร / ซ่อน"],
        ],
      },
      { name: "description", label: "รายละเอียดโครงการ", type: "textarea", wide: true },
    ],
    columns: [
      ["name_th", "โครงการ"],
      ["location", "ทำเล"],
      ["property_type", "ประเภท"],
      ["starting_price", "ราคาเริ่มต้น"],
      ["status", "สถานะ"],
    ],
  },
  "house-types": {
    eyebrow: "PROJECT CMS",
    title: "จัดการแบบบ้าน",
    intro: "เพิ่มข้อมูลพื้นที่ใช้สอยและฟังก์ชันของแต่ละแบบบ้าน",
    formTitle: "เพิ่ม / แก้ไขแบบบ้าน",
    fields: [
      { name: "project_id", label: "โครงการ", type: "project", required: true },
      { name: "name", label: "ชื่อแบบบ้าน", required: true },
      { name: "bedrooms", label: "ห้องนอน", type: "number" },
      { name: "bathrooms", label: "ห้องน้ำ", type: "number" },
      { name: "usable_area_sqm", label: "พื้นที่ใช้สอย (ตร.ม.)", type: "number" },
      { name: "starting_price", label: "ราคาเริ่มต้น (บาท)", type: "number" },
      { name: "description", label: "รายละเอียดแบบบ้าน", type: "textarea", wide: true },
    ],
    columns: [
      ["project_name", "โครงการ"],
      ["name", "แบบบ้าน"],
      ["bedrooms", "ห้องนอน"],
      ["bathrooms", "ห้องน้ำ"],
      ["usable_area_sqm", "พื้นที่ใช้สอย"],
    ],
  },
  facilities: {
    eyebrow: "PROJECT CMS",
    title: "สิ่งอำนวยความสะดวก",
    intro: "จัดการไฮไลท์และส่วนกลางของแต่ละโครงการ",
    formTitle: "เพิ่มสิ่งอำนวยความสะดวก",
    fields: [
      { name: "project_id", label: "โครงการ", type: "project", required: true },
      { name: "name", label: "ชื่อสิ่งอำนวยความสะดวก", required: true },
      { name: "sort_order", label: "ลำดับการแสดง", type: "number" },
      { name: "description", label: "รายละเอียดเพิ่มเติม", type: "textarea", wide: true },
    ],
    columns: [
      ["project_name", "โครงการ"],
      ["name", "รายการ"],
      ["sort_order", "ลำดับ"],
    ],
  },
  promotions: {
    eyebrow: "PROJECT CMS",
    title: "โปรโมชั่นและแคมเปญ",
    intro: "กำหนดสิทธิพิเศษ ช่วงเวลา และสถานะการเผยแพร่",
    formTitle: "เพิ่มโปรโมชั่น / แคมเปญ",
    fields: [
      { name: "project_id", label: "โครงการ", type: "project" },
      { name: "title", label: "หัวข้อโปรโมชั่น", required: true },
      { name: "starts_at", label: "วันเริ่มแคมเปญ", type: "datetime" },
      { name: "ends_at", label: "วันสิ้นสุดแคมเปญ", type: "datetime" },
      { name: "body", label: "รายละเอียดและเงื่อนไข", type: "textarea", wide: true },
      { name: "is_published", label: "แสดงผลทันที (Active)", type: "checkbox" },
    ],
    columns: [
      ["project_name", "โครงการ"],
      ["title", "หัวข้อโปรโมชั่น"],
      ["is_published", "สถานะ"],
      ["created_at", "สร้างเมื่อ"],
    ],
  },
  news: {
    eyebrow: "PROJECT CMS",
    title: "ข่าวสารและกิจกรรม",
    intro: "เผยแพร่ข่าวประชาสัมพันธ์และกิจกรรมของโครงการ",
    formTitle: "เพิ่มข่าวสาร / กิจกรรม",
    fields: [
      { name: "project_id", label: "โครงการ", type: "project" },
      {
        name: "category",
        label: "หมวดหมู่",
        type: "select",
        required: true,
        options: [
          ["NEWS", "ข่าวประชาสัมพันธ์"],
          ["EVENT", "กิจกรรมประจำโครงการ"],
        ],
      },
      { name: "title", label: "หัวข้อข่าวสาร", required: true, wide: true },
      { name: "published_at", label: "วันเผยแพร่", type: "datetime" },
      { name: "is_published", label: "เผยแพร่ข่าวสารนี้", type: "checkbox" },
      { name: "body", label: "เนื้อหาข่าวสารแบบย่อ", type: "textarea", wide: true },
    ],
    columns: [
      ["category", "หมวดหมู่"],
      ["title", "หัวข้อข่าวสาร"],
      ["project_name", "โครงการ"],
      ["is_published", "สถานะ"],
    ],
  },
  leads: {
    eyebrow: "CUSTOMER RELATION",
    title: "รายชื่อผู้ลงทะเบียน",
    intro: "ติดตามผลลูกค้าที่ส่งข้อมูลจากแบบฟอร์มหน้าเว็บไซต์",
    formTitle: "บันทึกสถานะการติดตาม",
    fields: [
      {
        name: "status",
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
    columns: [
      ["created_at", "วันที่ / เวลา"],
      ["name", "ชื่อ-นามสกุล"],
      ["phone", "เบอร์ติดต่อ"],
      ["province", "จังหวัด"],
      ["project_name", "โครงการ"],
      ["budget", "งบประมาณ"],
      ["preferred_contact_date", "วันที่สะดวก"],
      ["status", "สถานะติดตาม"],
    ],
    canCreate: false,
    exportUrl: "/api/admin/leads?format=csv",
  },
  content: {
    eyebrow: "WEBSITE CMS",
    title: "ข้อมูลหน้าหลักและติดต่อ",
    intro: "แก้ไขข้อความ Hero หน้าแรกและช่องทางติดต่อที่แสดงบนเว็บไซต์",
    formTitle: "เพิ่ม / แก้ไขเนื้อหาเว็บไซต์",
    fields: [
      { name: "content_key", label: "Content key", hint: "home_hero หรือ contact", required: true },
      { name: "title", label: "หัวข้อ", required: true },
      { name: "body", label: "รายละเอียดเนื้อหา", type: "textarea", wide: true },
    ],
    columns: [
      ["content_key", "Content key"],
      ["title", "หัวข้อ"],
      ["updated_at", "อัปเดตล่าสุด"],
    ],
  },
  users: {
    eyebrow: "SYSTEM SETTINGS",
    title: "จัดการผู้ใช้งาน",
    intro: "กำหนดสิทธิ์และสร้างบัญชีสำหรับเข้าจัดการระบบ",
    formTitle: "เพิ่มผู้ใช้งานใหม่",
    fields: [
      { name: "name", label: "ชื่อ-นามสกุล", required: true },
      { name: "email", label: "อีเมลใช้งาน (Username)", required: true },
      { name: "password", label: "รหัสผ่านเริ่มต้น", hint: "อย่างน้อย 8 ตัวอักษร", type: "password" },
      {
        name: "role",
        label: "ระดับสิทธิ์การใช้งาน",
        type: "select",
        required: true,
        options: [
          ["SUPER_ADMIN", "Super Admin (ทุกส่วน)"],
          ["ADMIN", "Admin / Marketing"],
          ["USER", "User (ไม่มีสิทธิ์หลังบ้าน)"],
        ],
      },
      { name: "is_active", label: "เปิดใช้งานบัญชี", type: "checkbox" },
    ],
    columns: [
      ["name", "ผู้ใช้งาน"],
      ["email", "อีเมล"],
      ["role", "ระดับสิทธิ์"],
      ["is_active", "สถานะบัญชี"],
      ["created_at", "สร้างเมื่อ"],
    ],
  },
};

const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
function initialValues(config: Config) {
  return Object.fromEntries(config.fields.map((field) => [field.name, field.type === "checkbox" ? false : ""]));
}
function display(field: string, value: unknown) {
  if (field === "is_published" || field === "is_active")
    return value === true || value === 1 ? "เปิดใช้งาน" : "แบบร่าง / ปิด";
  if (!value) return "-";
  if (field.includes("price") && Number.isFinite(Number(value))) return `${Number(value).toLocaleString("th-TH")} บาท`;
  if (field.endsWith("_at") || field === "created_at" || field === "updated_at")
    return new Date(String(value)).toLocaleDateString("th-TH");
  return String(value);
}
function badge(field: string, value: unknown) {
  const text = display(field, value);
  if (field === "status")
    return value === "CONTACTED" || value === "CLOSED"
      ? "bg-emerald-100 text-emerald-700"
      : value === "QUALIFIED"
        ? "bg-indigo-100 text-indigo-700"
        : "bg-amber-100 text-amber-800";
  if (field === "is_published" || field === "is_active")
    return value === true || value === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500";
  if (field === "role") return value === "SUPER_ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-600";
}
function toInputValue(field: Field, value: unknown) {
  if (field.type !== "datetime" || !value) return value ?? "";
  const date = new Date(String(value));
  return Number.isNaN(date.valueOf()) ? "" : date.toISOString().slice(0, 16);
}

export function AdminResourceManager({ resource }: { resource: AdminResource }) {
  const config = configs[resource];
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [projects, setProjects] = useState<Record<string, string>[]>([]);
  const [form, setForm] = useState<Record<string, unknown>>(() => initialValues(config));
  const [editing, setEditing] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/${resource}`);
    if (!response.ok) {
      setMessage("ไม่สามารถโหลดข้อมูลได้");
      return;
    }
    const data = await response.json();
    setRows(data.rows ?? []);
    setProjects(data.projectOptions ?? []);
  }, [resource]);
  // This starts a network request; state changes happen after the request resolves.
  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => {
    setEditing(null);
    setForm(initialValues(config));
    setMessage("");
  };
  const setField = (name: string, value: unknown) => setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch(`/api/admin/${resource}`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { ...form, id: editing } : form),
    });
    const result = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(result.message ?? "บันทึกไม่สำเร็จ");
      return;
    }
    reset();
    setMessage("บันทึกข้อมูลเรียบร้อย");
    await load();
  };
  const edit = (row: Record<string, unknown>) => {
    setEditing(String(row.id));
    setForm(
      Object.fromEntries(
        config.fields.map((field) => [
          field.name,
          field.type === "checkbox" ? Boolean(row[field.name]) : toInputValue(field, row[field.name]),
        ]),
      ),
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (id: string) => {
    if (!window.confirm("ต้องการลบรายการนี้หรือไม่?")) return;
    const response = await fetch(`/api/admin/${resource}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const result = await response.json();
    if (!response.ok) setMessage(result.message ?? "ลบข้อมูลไม่สำเร็จ");
    else {
      setMessage("ลบรายการแล้ว");
      await load();
    }
  };
  const formCard = (config.canCreate !== false || editing) && (
    <form onSubmit={submit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 border-b border-slate-100 pb-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {editing ? `แก้ไข: ${config.formTitle}` : config.formTitle}
            </h2>
            <p className="mt-1 text-xs text-slate-400">กรอกเฉพาะข้อมูลที่ต้องการแสดงผลบนเว็บไซต์</p>
          </div>
          {editing && (
            <button type="button" onClick={reset} className="text-sm font-semibold text-slate-500 hover:text-slate-800">
              ยกเลิก
            </button>
          )}
        </div>
      </div>
      <div className="grid gap-4">
        {config.fields.map((field) => (
          <label
            key={field.name}
            className={`block text-sm font-semibold text-slate-700 ${field.wide || field.type === "textarea" ? "md:col-span-2" : ""}`}
          >
            {field.type === "checkbox" ? (
              <span className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 px-3 py-3">
                <input
                  type="checkbox"
                  checked={Boolean(form[field.name])}
                  onChange={(event) => setField(field.name, event.target.checked)}
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
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setField(field.name, event.target.value)}
                    className={`${inputClass} min-h-28`}
                  />
                ) : field.type === "select" || field.type === "project" ? (
                  <select
                    required={field.required}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setField(field.name, event.target.value)}
                    className={inputClass}
                  >
                    <option value="">{field.type === "project" ? "-- ไม่ระบุโครงการ --" : "-- เลือกข้อมูล --"}</option>
                    {field.type === "project"
                      ? projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name_th}
                          </option>
                        ))
                      : field.options?.map(([option, label]) => (
                          <option key={option} value={option}>
                            {label}
                          </option>
                        ))}
                  </select>
                ) : (
                  <input
                    required={field.required}
                    type={field.type === "datetime" ? "datetime-local" : (field.type ?? "text")}
                    value={String(form[field.name] ?? "")}
                    onChange={(event) => setField(field.name, event.target.value)}
                    className={inputClass}
                  />
                )}
                {field.hint && <span className="mt-1 block text-xs font-normal text-slate-400">{field.hint}</span>}
              </>
            )}
          </label>
        ))}
      </div>
      {message && (
        <p className="mt-4 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700">{message}</p>
      )}
      <button
        disabled={busy}
        className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
      >
        {busy
          ? "กำลังบันทึก..."
          : editing
            ? "บันทึกการแก้ไข"
            : resource === "users"
              ? "ยืนยันเพิ่มผู้ใช้งาน"
              : "บันทึกข้อมูล"}
      </button>
    </form>
  );
  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-500">{config.eyebrow}</p>
          <h1 className="mt-1 text-xl font-bold text-slate-800">{config.title}</h1>
          <p className="mt-1 text-sm text-slate-500">{config.intro}</p>
        </div>
        {config.exportUrl && (
          <a
            href={config.exportUrl}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
          >
            ⇩ ส่งออกข้อมูลลูกค้า (CSV)
          </a>
        )}
      </header>
      <div className={`mt-6 gap-6 ${resource === "users" ? "xl:grid xl:grid-cols-[22rem_1fr]" : ""}`}>
        {formCard}
        <section
          className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${resource === "users" ? "xl:mt-0" : "mt-6"}`}
        >
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-bold text-slate-800">
              {resource === "leads"
                ? "Customer Leads"
                : resource === "users"
                  ? "รายชื่อผู้ใช้งานในระบบ"
                  : "รายการข้อมูลในระบบ"}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-xs">
              <thead className="border-b border-slate-200 bg-slate-50 uppercase text-slate-500">
                <tr>
                  {config.columns.map(([, label]) => (
                    <th key={label} className="p-3 font-semibold">
                      {label}
                    </th>
                  ))}
                  <th className="p-3 text-right font-semibold">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rows.map((row) => (
                  <tr key={String(row.id)} className="hover:bg-slate-50/70">
                    {config.columns.map(([field]) => (
                      <td key={field} className="max-w-64 p-3">
                        {["status", "is_published", "is_active", "role"].includes(field) ? (
                          <span className={`inline-flex rounded px-2 py-1 font-bold ${badge(field, row[field])}`}>
                            {display(field, row[field])}
                          </span>
                        ) : (
                          <span className="wrap-break-word">{display(field, row[field])}</span>
                        )}
                      </td>
                    ))}
                    <td className="whitespace-nowrap p-3 text-right">
                      <button onClick={() => edit(row)} className="mr-3 font-bold text-indigo-600 hover:underline">
                        แก้ไข
                      </button>
                      <button
                        onClick={() => remove(String(row.id))}
                        className="font-bold text-rose-600 hover:underline"
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={config.columns.length + 1} className="p-12 text-center text-slate-400">
                      ยังไม่มีข้อมูลในระบบ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  );
}
