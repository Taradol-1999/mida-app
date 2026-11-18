"use client";

import { useEffect, useMemo, useState } from "react";
import { AdminFeedback, useAdminFeedback } from "@/components/admin-feedback";
import { BannerMediaUpload } from "@/components/banner-media-upload";
import { confirmDelete } from "@/lib/admin-alert";
import type { ProjectPopupData, ProjectPopupItem } from "@/lib/project-popup";

type Media = { id: string; name: string; mimeType: string; url: string };

function ToggleSwitch({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed disabled:opacity-50 ${checked ? "bg-emerald-500" : "bg-slate-300"}`}
    >
      <span
        className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}

export function ProjectPopupManager({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectPopupData>({ items: [] });
  const [media, setMedia] = useState<Media[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useAdminFeedback();
  const mediaById = useMemo(() => new Map(media.map((item) => [item.id, item])), [media]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/admin/project-popup?projectId=${projectId}`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=popup&list=1`),
    ])
      .then(async ([content, images]) => {
        if (!content.ok || !images.ok) throw new Error("โหลดข้อมูล Popup ไม่สำเร็จ กรุณาลองใหม่");
        const [saved, assets] = await Promise.all([content.json(), images.json()]);
        if (!cancelled) {
          setData(saved.data ?? { items: [] });
          setMedia(assets.rows ?? []);
          setReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "โหลดข้อมูลไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, setMessage]);

  function openCreate() {
    setEditingId(null);
    setFiles([]);
    setIsActive(true);
    setMessage("");
    setIsFormOpen(true);
  }

  function openEdit(item: ProjectPopupItem) {
    setEditingId(item.id);
    setFiles([]);
    setIsActive(item.isActive);
    setMessage("");
    setIsFormOpen(true);
  }

  function closeForm() {
    if (busy) return;
    setIsFormOpen(false);
    setEditingId(null);
    setFiles([]);
  }

  async function persist(items: ProjectPopupItem[]) {
    const response = await fetch("/api/admin/project-popup", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, data: { items } }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || "บันทึก Popup ไม่สำเร็จ");
  }

  async function removeMedia(id: string) {
    await fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=popup&mediaId=${id}`, {
      method: "DELETE",
    });
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const existing = editingId ? data.items.find((item) => item.id === editingId) : undefined;
    if (!existing && !files[0]) {
      setMessage("กรุณาเพิ่มรูป Popup");
      return;
    }
    setBusy(true);
    setMessage("");
    let uploadedId: string | null = null;
    try {
      let imageId = existing?.imageId ?? "";
      if (files[0]) {
        const upload = new FormData();
        upload.set("entityType", "projects");
        upload.set("entityId", projectId);
        upload.set("mediaKind", "popup");
        upload.set("file", files[0]);
        const mediaResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
        const mediaResult = await mediaResponse.json();
        if (!mediaResponse.ok) throw new Error(mediaResult.message || "อัปโหลดรูป Popup ไม่สำเร็จ");
        uploadedId = mediaResult.id;
        imageId = mediaResult.id;
      }
      const item: ProjectPopupItem = {
        id: existing?.id ?? crypto.randomUUID(),
        imageId,
        isActive,
      };
      const nextItems = existing
        ? data.items.map((current) => (current.id === existing.id ? item : current))
        : [item, ...data.items];
      await persist(nextItems);
      if (uploadedId) {
        const selectedFile = files[0];
        setMedia((current) => [
          {
            id: uploadedId!,
            name: selectedFile.name,
            mimeType: selectedFile.type,
            url: `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=popup&mediaId=${uploadedId}`,
          },
          ...current.filter((asset) => asset.id !== existing?.imageId),
        ]);
        if (existing?.imageId) await removeMedia(existing.imageId);
      }
      setData({ items: nextItems });
      setIsFormOpen(false);
      setEditingId(null);
      setFiles([]);
      setMessage(existing ? "บันทึกการแก้ไข Popup เรียบร้อยแล้ว" : "เพิ่ม Popup เรียบร้อยแล้ว", "success");
    } catch (error) {
      if (uploadedId) await removeMedia(uploadedId);
      setMessage(error instanceof Error ? error.message : "บันทึก Popup ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item: ProjectPopupItem) {
    setBusy(true);
    setMessage("");
    try {
      const nextItems = data.items.map((current) =>
        current.id === item.id ? { ...current, isActive: !current.isActive } : current,
      );
      await persist(nextItems);
      setData({ items: nextItems });
      setMessage(`${item.isActive ? "ปิด" : "เปิด"}การแสดง Popup เรียบร้อยแล้ว`, "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: ProjectPopupItem) {
    if (!(await confirmDelete("ต้องการลบ Popup รายการนี้หรือไม่?", "ยืนยันการลบ Popup"))) return;
    setBusy(true);
    setMessage("");
    try {
      const nextItems = data.items.filter((current) => current.id !== item.id);
      await persist(nextItems);
      await removeMedia(item.imageId);
      setData({ items: nextItems });
      setMedia((current) => current.filter((asset) => asset.id !== item.imageId));
      setMessage("ลบ Popup เรียบร้อยแล้ว", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบ Popup ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  const editing = editingId ? data.items.find((item) => item.id === editingId) : undefined;
  const editingMedia = editing ? mediaById.get(editing.imageId) : undefined;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-brand-primary">PROJECT ADVERTISING</p>
          <h1 className="mt-1 text-2xl font-extrabold text-brand-primary">Popup โฆษณาหน้าโครงการ</h1>
          <p className="mt-2 text-sm text-slate-500">เพิ่มรูปโฆษณาได้หลายรายการ และเลือกเปิดหรือปิดแต่ละรายการ</p>
        </div>
        <button type="button" onClick={openCreate} className="admin-button-primary" disabled={!ready || busy}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
          เพิ่ม Popup ใหม่
        </button>
      </div>
      <AdminFeedback notice={message} />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {data.items.map((item, index) => {
          const asset = mediaById.get(item.imageId);
          return (
            <article key={item.id} className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid h-44 shrink-0 place-items-center overflow-hidden bg-slate-100 p-2 sm:h-40">
                {asset ? (
                  // Uploaded PNG files must retain their transparent background in the preview.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={asset.url}
                    alt={`Popup ${index + 1}`}
                    className="block h-full max-h-full w-full max-w-full object-contain"
                  />
                ) : (
                  <i className="fa-solid fa-image text-4xl text-slate-300" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-800">Popup #{data.items.length - index}</p>
                    <p className={`mt-0.5 text-[0.68rem] font-semibold ${item.isActive ? "text-emerald-600" : "text-slate-400"}`}>
                      {item.isActive ? "กำลังแสดง" : "ปิดการแสดง"}
                    </p>
                  </div>
                  <ToggleSwitch
                    checked={item.isActive}
                    disabled={busy}
                    label={`${item.isActive ? "ปิด" : "เปิด"} Popup ${data.items.length - index}`}
                    onChange={() => toggle(item)}
                  />
                </div>
                <div className="mt-auto grid grid-cols-2 gap-1.5 pt-3">
                  <button type="button" onClick={() => openEdit(item)} disabled={busy} className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-soft">
                    <i className="fa-solid fa-pen" aria-hidden="true" />
                    <span className="ml-1.5">แก้ไข</span>
                  </button>
                  <button type="button" onClick={() => remove(item)} disabled={busy} className="rounded-lg border border-rose-200 px-2 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-50">
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                    <span className="ml-1.5">ลบ</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {ready && !data.items.length && (
          <div className="col-span-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-14 text-center text-slate-400 sm:col-span-3 lg:col-span-4 xl:col-span-5 2xl:col-span-6">
            <i className="fa-solid fa-rectangle-ad text-4xl" aria-hidden="true" />
            <p className="mt-3 font-semibold">ยังไม่มี Popup โฆษณา</p>
            <p className="mt-1 text-sm">กด “เพิ่ม Popup ใหม่” เพื่อเริ่มเพิ่มรายการ</p>
          </div>
        )}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-100 flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">
          <div role="dialog" aria-modal="true" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <p className="text-xs font-bold tracking-[0.14em] text-brand-primary">POPUP AD</p>
                <h2 className="mt-1 text-xl font-extrabold text-slate-800">{editing ? "แก้ไข Popup" : "เพิ่ม Popup ใหม่"}</h2>
              </div>
              <button type="button" onClick={closeForm} className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200" aria-label="ปิดหน้าต่าง">
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <AdminFeedback notice={message} />
            <form onSubmit={save} className="mt-5">
              <fieldset disabled={busy} className="grid gap-5 disabled:opacity-60">
                <BannerMediaUpload
                  title="รูป Popup โฆษณา"
                  single
                  allowVideo={false}
                  allowRemoveSaved={false}
                  media={editingMedia ? [editingMedia] : []}
                  files={files}
                  onFilesChange={setFiles}
                  onRemove={() => undefined}
                  disabled={busy}
                />
                <p className="-mt-4 text-xs text-slate-500">รองรับ PNG โปร่งใส, JPG และ WEBP ไม่เกิน 5 MB</p>
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span>
                    <span className="block font-bold text-brand-primary">แสดง Popup บนหน้าบ้าน</span>
                    <span className="mt-0.5 block text-xs text-slate-500">เปิดหรือปิดรายการนี้ได้ตลอดเวลา</span>
                  </span>
                  <ToggleSwitch
                    checked={isActive}
                    disabled={busy}
                    label={`${isActive ? "ปิด" : "เปิด"}การแสดง Popup รายการนี้`}
                    onChange={() => setIsActive((current) => !current)}
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button type="button" onClick={closeForm} className="admin-button-secondary" disabled={busy}>ยกเลิก</button>
                  <button type="submit" className="admin-button-primary" disabled={busy}>
                    <i className={`fa-solid ${busy ? "fa-spinner animate-spin" : "fa-floppy-disk"}`} aria-hidden="true" />
                    {busy ? "กำลังบันทึก..." : editing ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

