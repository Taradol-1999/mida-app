"use client";

import { BannerMediaUpload } from "@/components/banner-media-upload";

import { Input, Textarea } from "@/components/ui/form-controls";
/* eslint-disable react-hooks/set-state-in-effect */

import { FormEvent, useCallback, useEffect, useState } from "react";

type Media = { id: string; name: string; mimeType: string; url: string };

export function MidaFrontendManager() {
  const [contentId, setContentId] = useState("");
  const [headline, setHeadline] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<Media[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadImages = useCallback(async (id: string) => {
    if (!id) return setImages([]);
    const response = await fetch(`/api/admin/media?entityType=site-content&entityId=${id}&mediaKind=hero&list=1`);
    const data = response.ok ? await response.json() : { rows: [] };
    setImages(data.rows ?? []);
  }, []);

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/content");
    if (!response.ok) return setMessage("ไม่สามารถโหลดข้อมูลเว็บไซต์ส่วนกลางได้");
    const data = await response.json();
    const home = (data.rows ?? []).find((row: Record<string, unknown>) => row.content_key === "home_hero");
    if (!home) return;
    const id = String(home.id);
    setContentId(id);
    setHeadline(String(home.title ?? ""));
    setDescription(String(home.body ?? ""));
    await loadImages(id);
  }, [loadImages]);

  useEffect(() => void load(), [load]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const response = await fetch("/api/admin/content", {
      method: contentId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contentId, content_key: "home_hero", title: headline, body: description }),
    });
    if (!response.ok) {
      const result = await response.json();
      setMessage(result.message ?? "บันทึกข้อมูลไม่สำเร็จ");
      setBusy(false);
      return;
    }
    if (!contentId) {
      await load();
      setMessage("บันทึกข้อความแล้ว กรุณากดบันทึกอีกครั้งเพื่ออัปโหลดรูปภาพหรือวิดีโอ");
      setBusy(false);
      return;
    }
    for (const file of files) {
      const upload = new FormData();
      upload.set("entityType", "site-content");
      upload.set("entityId", contentId);
      upload.set("mediaKind", "hero");
      upload.set("file", file);
      const uploadResponse = await fetch("/api/admin/media", { method: "POST", body: upload });
      if (!uploadResponse.ok) {
        setMessage("บันทึกข้อความแล้ว แต่มีไฟล์สไลด์บางรายการอัปโหลดไม่สำเร็จ");
        setBusy(false);
        return;
      }
    }
    setFiles([]);
    await loadImages(contentId);
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
        <label className="block font-semibold text-slate-700">
          คำพาดหัวหลักของบริษัท (Corporate Headline)
          <Input
            required
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block font-semibold text-slate-700">
          คำอธิบายหน้าแรกส่วนกลาง
          <Textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
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
