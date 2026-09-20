"use client";
/* eslint-disable @next/next/no-img-element */
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
          <input
            required
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <label className="block font-semibold text-slate-700">
          คำอธิบายหน้าแรกส่วนกลาง
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1.5 min-h-24 w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-brand-primary"
          />
        </label>
        <div>
          <p className="font-semibold text-slate-700">
            รูปภาพและวิดีโอแบนเนอร์สไลด์หลักหน้าแรกส่วนกลาง (Main Frontend Slider)
          </p>
          <label className="mt-2 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-400 hover:bg-slate-100">
            <i className="fa-regular fa-image mb-2 text-3xl text-brand-primary" />
            <span>{files.length ? `เลือกแล้ว ${files.length} ไฟล์` : "อัปโหลดรูปภาพหรือวิดีโอสไลด์หน้าเว็บกลาง"}</span>
            <small className="mt-1">
              รูปแนะนำขนาด 1920 × 800 px · วิดีโอ MP4/WEBM ไม่เกิน 50 MB · เลือกได้หลายไฟล์
            </small>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
              className="sr-only"
              onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
            />
          </label>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => (
              <div key={image.id} className="relative overflow-hidden rounded-xl border border-slate-200">
                {image.mimeType.startsWith("video/") ? (
                  <video src={image.url} className="h-28 w-full object-cover" muted playsInline preload="metadata" />
                ) : (
                  <img src={image.url} alt={image.name} className="h-28 w-full object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => void removeImage(image.id)}
                  className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-rose-600 text-white"
                  aria-label="ลบรูป"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            ))}
          </div>
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
