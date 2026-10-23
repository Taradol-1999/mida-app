"use client";

import Image from "next/image";
import { useEffect, useId, useState } from "react";
import midaLogo from "@/assets/logos/png/01-mida-property.png";

type Logo = { id: string; url: string };
export function ProjectLogoUpload({ projectId }: { projectId: string }) {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useState("");
  const id = useId();
  const endpoint = `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=logo`;
  useEffect(() => {
    let cancelled = false;
    fetch(`${endpoint}&list=1`)
      .then(async (response) => {
        if (!response.ok) throw new Error("โหลดโลโก้ไม่สำเร็จ");
        const data = await response.json();
        if (!cancelled) setLogo(data.rows?.[0] ?? null);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);
  async function upload(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setMessage("รองรับ JPG, PNG, WEBP ไม่เกิน 5 MB");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const form = new FormData();
      form.set("entityType", "projects");
      form.set("entityId", projectId);
      form.set("mediaKind", "logo");
      form.set("file", file);
      const response = await fetch("/api/admin/media", { method: "POST", body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "อัปโหลดโลโก้ไม่สำเร็จ");
      setLogo({ id: result.id, url: `${endpoint}&mediaId=${result.id}` });
      setMessage("บันทึกโลโก้เรียบร้อยแล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!logo || !confirm("ลบโลโก้โครงการและกลับไปใช้โลโก้ MIDA ใช่หรือไม่?")) return;
    setBusy(true);
    try {
      const response = await fetch(`${endpoint}&mediaId=${logo.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("ลบโลโก้ไม่สำเร็จ");
      setLogo(null);
      setMessage("กลับไปใช้โลโก้ MIDA แล้ว");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <Image
          src={logo?.url ?? midaLogo}
          alt="โลโก้โครงการ"
          fill
          unoptimized={Boolean(logo)}
          sizes="96px"
          className="object-contain p-2"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-700">โลโก้โครงการ</p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP · ไม่เกิน 5 MB</p>
        <label
          htmlFor={id}
          className={`mt-2 inline-flex min-h-10 items-center rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-soft ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}
        >
          <i className="fa-solid fa-cloud-arrow-up mr-1" aria-hidden="true" />
          {busy ? "กำลังดำเนินการ…" : "อัปโหลดหรือเปลี่ยนโลโก้"}
        </label>
        <input
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="sr-only"
          onChange={(event) => {
            void upload(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        {logo && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void remove()}
            className="ml-3 text-xs text-red-600 disabled:opacity-50"
          >
            ลบโลโก้
          </button>
        )}
        <p className="mt-1 text-xs text-slate-500">หากยังไม่มีโลโก้ จะใช้โลโก้ MIDA</p>
        {message && (
          <p role="status" className="mt-2 text-xs text-brand-primary">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
