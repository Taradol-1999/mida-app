"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Input, Textarea } from "@/components/ui/form-controls";
import { BannerMediaUpload } from "@/components/banner-media-upload";
import { FileDropzone } from "@/components/file-dropzone";
import { confirmDelete } from "@/lib/admin-alert";
/* eslint-disable react-hooks/set-state-in-effect */

type LivingRow = {
  id: string;
  name_th: string;
  name_en: string | null;
  description_th: string | null;
  description_en: string | null;
  website_url: string | null;
  sort_order: number;
  is_active: boolean;
  imageId: string | null;
  imageUrl: string | null;
};

type FormState = Omit<LivingRow, "id" | "imageId" | "imageUrl" | "sort_order">;
const emptyForm: FormState = {
  name_th: "",
  name_en: "",
  description_th: "",
  description_en: "",
  website_url: "",
  is_active: true,
};

function PortraitUpload({
  file,
  imageUrl,
  onChange,
  disabled,
}: {
  file: File | null;
  imageUrl: string | null;
  onChange: (file: File | null) => void;
  disabled: boolean;
}) {
  const [preview, setPreview] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function select(selected?: File) {
    if (!selected) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 5 * 1024 * 1024) {
      setError("กรุณาเลือกรูป JPG, PNG หรือ WEBP ขนาดไม่เกิน 5 MB");
      return;
    }
    setError("");
    onChange(selected);
  }

  const image = file ? preview : imageUrl;
  return (
    <div>
      <FileDropzone
        title="ลากและวางรูปภาพที่นี่"
        hint="JPG, PNG, WEBP · ไม่เกิน 5 MB · แนะนำ 3:4 หรือ 4:5"
        accept="image/jpeg,image/png,image/webp"
        disabled={disabled}
        fileName={file?.name}
        className="mt-2 min-h-52"
        onFilesChange={(files) => select(files[0])}
        preview={
          image ? (
            // The selected file uses a local object URL for its preview.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="ตัวอย่างรูปภาพ" className="mb-3 h-32 max-w-full rounded-lg object-contain" />
          ) : undefined
        }
      />
      {file && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(null)}
          className="mt-2 text-xs text-rose-600 hover:underline disabled:opacity-50"
        >
          ยกเลิกรูปที่เลือก
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}

async function responseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return {} as T;
  }
}

export function MidaLivingManager({ blog = false }: { blog?: boolean }) {
  const endpoint = blog ? "/api/admin/mida-blog" : "/api/admin/mida-living";
  const entityType = blog ? "mida-blog" : "mida-living";
  const [rows, setRows] = useState<LivingRow[]>([]);
  const [editing, setEditing] = useState<LivingRow | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [blogFiles, setBlogFiles] = useState<File[]>([]);
  const [blogMedia, setBlogMedia] = useState<
    { id: string; name: string; mimeType: string; url: string; kind: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await responseJson<{ rows?: LivingRow[]; message?: string }>(response);
      if (response.ok) setRows(data.rows ?? []);
      else setError(data.message ?? "โหลดข้อมูลไม่สำเร็จ กรุณาลองรีเฟรชหน้าอีกครั้ง");
    } catch {
      setError("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองรีเฟรชหน้าอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => void load(), [load]);

  function reset() {
    setOpen(false);
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    setBlogFiles([]);
    setBlogMedia([]);
    setError("");
    setMessage("");
  }

  async function startEdit(row: LivingRow) {
    setBlogFiles([]);
    setBlogMedia([]);
    setEditing(row);
    setForm({
      name_th: row.name_th,
      name_en: row.name_en ?? "",
      description_th: row.description_th ?? "",
      description_en: row.description_en ?? "",
      website_url: row.website_url ?? "",
      is_active: row.is_active,
    });
    setFile(null);
    setError("");
    setMessage("");
    setOpen(true);
    if (blog) {
      try {
        const kinds = ["cover", "gallery"];
        const results = await Promise.all(
          kinds.map(async (kind) => {
            const response = await fetch(
              `/api/admin/media?entityType=mida-blog&entityId=${row.id}&mediaKind=${kind}&list=1`,
            );
            if (!response.ok) throw new Error("โหลดรูปภาพไม่สำเร็จ");
            const data = await response.json();
            return (data.rows as { id: string; name: string; mimeType: string; url: string }[]).map((item) => ({
              ...item,
              kind,
            }));
          }),
        );
        setBlogMedia(results.flat());
      } catch {
        setError("โหลดรูปภาพไม่สำเร็จ กรุณาลองอีกครั้ง");
      }
    }
  }

  async function removeBlogMedia(id: string) {
    const item = blogMedia.find((media) => media.id === id);
    if (!editing || !item || !(await confirmDelete("ต้องการลบรูปภาพนี้หรือไม่?", "ยืนยันการลบรูปภาพ"))) return;
    const response = await fetch(
      `/api/admin/media?entityType=mida-blog&entityId=${editing.id}&mediaKind=${item.kind}&mediaId=${id}`,
      { method: "DELETE" },
    );
    if (response.ok) setBlogMedia((items) => items.filter((media) => media.id !== id));
    else setError("ลบรูปภาพไม่สำเร็จ");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch(endpoint, {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing ? { id: editing.id, ...form } : form),
    });
    const data = await responseJson<{ row?: LivingRow; message?: string }>(response);
    if (!response.ok || !data.row) {
      setError(data.message ?? "บันทึกข้อมูลไม่สำเร็จ");
      setSaving(false);
      return;
    }
    if (blog && blogFiles.length) {
      for (const [index, selected] of blogFiles.entries()) {
        const upload = new FormData();
        upload.set("entityType", "mida-blog");
        upload.set("entityId", data.row.id);
        upload.set("mediaKind", "gallery");
        upload.set("file", selected);
        const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
        if (!uploadResponse.ok) {
          const uploadData = await responseJson<{ message?: string }>(uploadResponse);
          setError(`บันทึกบทความแล้ว แต่อัปโหลดรูปภาพไม่สำเร็จ: ${uploadData.message ?? "กรุณาลองใหม่"}`);
          setBlogFiles(blogFiles.slice(index));
          setEditing(data.row);
          setSaving(false);
          await load();
          return;
        }
      }
    }
    if (file) {
      const upload = new FormData();
      upload.set("entityType", entityType);
      upload.set("entityId", data.row.id);
      upload.set("mediaKind", blog ? "cover" : "portrait");
      upload.set("file", file);
      const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
      if (!uploadResponse.ok) {
        const uploadData = await responseJson<{ message?: string }>(uploadResponse);
        setError(`บันทึกข้อมูลแล้ว แต่รูปภาพไม่สำเร็จ: ${uploadData.message ?? "กรุณาลองใหม่"}`);
        setSaving(false);
        setEditing(data.row);
        await load();
        return;
      }
    }
    setMessage(editing ? "บันทึกการแก้ไขเรียบร้อย" : "เพิ่มรายการเรียบร้อย");
    setEditing(null);
    setOpen(false);
    setForm(emptyForm);
    setFile(null);
    setBlogFiles([]);
    setBlogMedia([]);
    setSaving(false);
    await load();
  }

  async function remove(row: LivingRow) {
    if (!(await confirmDelete(`ต้องการลบ “${row.name_th}” หรือไม่`))) return;
    const response = await fetch(`${endpoint}?id=${row.id}`, { method: "DELETE" });
    const data = await responseJson<{ message?: string }>(response);
    if (!response.ok) return setError(data.message ?? "ลบข้อมูลไม่สำเร็จ");
    if (editing?.id === row.id) reset();
    setMessage("ลบรายการเรียบร้อย");
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-accent">MIDA PROPERTY · ส่วนกลาง</p>
        <h1 className="mt-1 text-2xl font-black text-brand-primary md:text-3xl">
          {blog ? "Blog เรื่องราวที่น่าสนใจ" : "เริ่มที่เรา เริ่มที่ไมด้า"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {blog
            ? "จัดการบทความส่วนกลางที่แสดงบนหน้าแรก พร้อมรูปภาพประกอบ"
            : "จัดการการ์ดธุรกิจที่แสดงบนหน้าแรก พร้อมรูปแนวตั้งและลิงก์เว็บไซต์"}
        </p>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-slate-950/45 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={editing ? "แก้ไขรายการ" : "เพิ่มรายการใหม่"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) reset();
          }}
        >
          <form
            onSubmit={submit}
            className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-xl sm:rounded-2xl md:p-7"
          >
            <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <h2 className="font-bold text-brand-primary">
                {editing ? `แก้ไข: ${editing.name_th}` : blog ? "เพิ่มบทความ Blog" : "เพิ่มรายการใหม่"}
              </h2>
              <button
                type="button"
                onClick={reset}
                aria-label="ปิด"
                className="text-sm font-semibold text-slate-500 hover:text-brand-primary"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                {blog ? "หัวข้อบทความ (TH)" : "ชื่อ (TH)"} <span className="text-rose-500">*</span>
                <Input required value={form.name_th} onChange={(e) => setForm({ ...form, name_th: e.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                {blog ? "หัวข้อบทความ (EN)" : "ชื่อ (EN)"}
                <Input value={form.name_en ?? ""} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                คำอธิบาย (TH)
                <Textarea
                  rows={4}
                  value={form.description_th ?? ""}
                  onChange={(e) => setForm({ ...form, description_th: e.target.value })}
                />
              </label>
              <label className="space-y-2 text-sm font-semibold text-slate-700">
                คำอธิบาย (EN)
                <Textarea
                  rows={4}
                  value={form.description_en ?? ""}
                  onChange={(e) => setForm({ ...form, description_en: e.target.value })}
                />
              </label>
              {!blog && (
                <label className="space-y-2 text-sm font-semibold text-slate-700 md:col-span-2">
                  ลิงก์เว็บไซต์
                  <Input
                    type="url"
                    placeholder="https://example.com"
                    value={form.website_url ?? ""}
                    onChange={(e) => setForm({ ...form, website_url: e.target.value })}
                  />
                </label>
              )}
              <div className="md:col-span-2">
                {blog ? (
                  <BannerMediaUpload
                    title="รูปภาพประกอบบทความ"
                    allowVideo={false}
                    media={blogMedia}
                    files={blogFiles}
                    onFilesChange={setBlogFiles}
                    onRemove={removeBlogMedia}
                    disabled={saving}
                  />
                ) : (
                  <PortraitUpload
                    file={file}
                    imageUrl={editing?.imageUrl ?? null}
                    onChange={setFile}
                    disabled={saving}
                  />
                )}
              </div>
              {blog && (
                <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 text-sm font-semibold text-slate-700 md:col-span-2">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="size-4 accent-brand-primary"
                  />
                  เผยแพร่บทความนี้บนหน้าแรก
                </label>
              )}
            </div>
            {(message || error) && (
              <p
                className={`mt-5 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
              >
                {error || message}
              </p>
            )}
            <button
              disabled={saving}
              className="mt-6 min-h-11 rounded-xl bg-brand-primary px-6 text-sm font-bold text-white transition hover:bg-brand-secondary disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
            </button>
          </form>
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold text-brand-primary">รายการทั้งหมด</h2>
          <button
            type="button"
            onClick={() => {
              reset();
              setOpen(true);
            }}
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-bold text-white hover:bg-brand-secondary"
          >
            <i className="fa-solid fa-plus mr-2" />
            เพิ่มรายการ
          </button>
        </div>
        {(message || (!open && error)) && (
          <p
            className={`mb-4 rounded-xl px-4 py-3 text-sm ${error ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}
          >
            {error || message}
          </p>
        )}
        {loading ? (
          <p className="py-10 text-center text-sm text-slate-400">กำลังโหลด...</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
            ยังไม่มีรายการ กดเพิ่มรายการเพื่อเริ่มต้น
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="p-3">รูปภาพ</th>
                  <th className="p-3">{blog ? "หัวข้อบทความ" : "ชื่อ"}</th>
                  <th className="p-3">คำอธิบาย</th>
                  {!blog && <th className="p-3">เว็บไซต์</th>}
                  {blog && <th className="p-3">สถานะ</th>}
                  <th className="p-3 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="p-3">
                      <div className="relative h-20 w-16 overflow-hidden rounded-lg bg-slate-100">
                        {row.imageUrl ? (
                          <Image
                            src={row.imageUrl}
                            alt={row.name_th}
                            fill
                            className="object-cover"
                            sizes="(min-width:1280px) 360px, (min-width:640px) 50vw, 100vw"
                          />
                        ) : (
                          <span className="absolute inset-0 grid place-items-center text-center text-sm text-slate-400">
                            <i className="fa-regular fa-image mb-2 block text-3xl" />
                            ยังไม่มีรูปภาพ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-bold text-brand-primary">{row.name_th}</span>
                      {row.name_en && <p className="mt-1 text-xs text-slate-400">{row.name_en}</p>}
                    </td>
                    <td className="max-w-xs p-3 text-slate-500">
                      <p className="line-clamp-2">{row.description_th || "—"}</p>
                    </td>
                    {!blog && (
                      <td className="p-3">
                        {row.website_url && (
                          <a
                            href={row.website_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`เปิดเว็บไซต์ ${row.name_th}`}
                            className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-50 text-brand-primary hover:bg-brand-primary hover:text-white"
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square text-xs" />
                          </a>
                        )}
                      </td>
                    )}
                    {blog && (
                      <td className="p-3">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${row.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {row.is_active ? "เผยแพร่" : "ฉบับร่าง"}
                        </span>
                      </td>
                    )}
                    <td className="p-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void startEdit(row)}
                          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-bold text-brand-primary hover:bg-blue-100"
                        >
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          onClick={() => void remove(row)}
                          className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-bold text-rose-600 hover:bg-rose-100"
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
