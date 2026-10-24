"use client";

import { AdminFeedback, useAdminFeedback } from "@/components/admin-feedback";

import Image from "next/image";
import { useEffect, useState } from "react";
import midaLogo from "@/assets/logos/png/01-mida-property.png";
import { FileDropzone } from "@/components/file-dropzone";
import { UploadRemoveButton } from "@/components/upload-remove-button";
import { confirmDelete } from "@/lib/admin-alert";

type Logo = { id: string; url: string };
export function ProjectLogoUpload({ projectId }: { projectId: string }) {
  const [logo, setLogo] = useState<Logo | null>(null);
  const [busy, setBusy] = useState(true);
  const [message, setMessage] = useAdminFeedback();
  const endpoint = `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=logo`;
  useEffect(() => {
    let cancelled = false;
    fetch(`${endpoint}&list=1`, { cache: "no-store" })
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
  }, [endpoint, setMessage]);
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
      setLogo({ id: result.id, url: `${endpoint}&mediaId=${result.id}&v=${Date.now()}` });
      setMessage("บันทึกโลโก้เรียบร้อยแล้ว", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!logo || !(await confirmDelete("ลบโลโก้โครงการและกลับไปใช้โลโก้ MIDA ใช่หรือไม่?", "ยืนยันการลบโลโก้"))) return;
    setBusy(true);
    try {
      const response = await fetch(`${endpoint}&mediaId=${logo.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("ลบโลโก้ไม่สำเร็จ");
      setLogo(null);
      setMessage("กลับไปใช้โลโก้ MIDA แล้ว", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "ลบไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-700">โลโก้โครงการ</p>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP · ไม่เกิน 5 MB</p>
        <FileDropzone
          title={busy ? "กำลังดำเนินการ…" : "ลากและวางโลโก้ที่นี่"}
          hint="JPG, PNG, WEBP · ไม่เกิน 5 MB"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          className="mt-3 min-h-28"
          onFilesChange={(files) => void upload(files[0])}
          preview={
            <div className="relative mx-auto w-full max-w-lg rounded-lg border border-slate-200 bg-white p-4">
              <div className="relative mx-auto h-36 w-full">
                <Image
                  key={logo?.url ?? "mida-default-logo"}
                  src={logo?.url ?? midaLogo}
                  alt="โลโก้โครงการ"
                  fill
                  unoptimized={Boolean(logo)}
                  sizes="(min-width: 640px) 480px, 80vw"
                  className="object-contain p-2"
                />
              </div>
              {logo && <UploadRemoveButton label="ลบโลโก้โครงการ" disabled={busy} onRemove={remove} />}
            </div>
          }
        />
        <p className="mt-1 text-xs text-slate-500">หากยังไม่มีโลโก้ จะใช้โลโก้ MIDA</p>
        <AdminFeedback notice={message} />
      </div>
    </div>
  );
}
