"use client";

/* Uploaded previews use their original local or API URLs. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { BannerMediaUpload } from "@/components/banner-media-upload";
import { Textarea } from "@/components/ui/form-controls";

export type HouseFloorplanMedia = { id: string; name: string; mimeType: string; url: string };

const fileKey = (file: File) => `${file.name}-${file.size}-${file.lastModified}`;

function PendingPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url ? <img src={url} alt={file.name} className="size-full object-contain p-5" /> : null;
}

export function HouseFloorplanEditor({
  media,
  files,
  descriptions,
  pendingDescriptions,
  disabled,
  onFilesChange,
  onDescriptionChange,
  onPendingDescriptionChange,
  onRemove,
}: {
  media: HouseFloorplanMedia[];
  files: File[];
  descriptions: Record<string, string>;
  pendingDescriptions: Record<string, string>;
  disabled?: boolean;
  onFilesChange: (files: File[]) => void;
  onDescriptionChange: (id: string, value: string) => void;
  onPendingDescriptionChange: (key: string, value: string) => void;
  onRemove: (id: string) => void | Promise<void>;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
      <BannerMediaUpload
        title="รูปภาพ Floor Plan"
        hideEmptyState
        allowVideo={false}
        media={[]}
        files={[]}
        onFilesChange={(selected) => onFilesChange([...files, ...selected])}
        onRemove={() => undefined}
        disabled={disabled}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-3">
        {files.map((file, index) => {
          const key = fileKey(file);
          return (
            <article
              key={key}
              className="order-first min-w-0 overflow-hidden rounded-2xl border border-brand-accent/45 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <header className="mb-3 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-accent-soft text-[11px] font-bold text-brand-primary">
                    {media.length + index + 1}
                  </span>
                  <span className="truncate text-xs font-medium text-slate-600" title={file.name}>
                    {file.name}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onFilesChange(files.filter((_, position) => position !== index))}
                  aria-label={`ยกเลิก ${file.name}`}
                  className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                >
                  <i className="fa-regular fa-trash-can text-xs" aria-hidden="true" />
                </button>
              </header>
              <div className="h-48 overflow-hidden rounded-xl border border-slate-100 bg-brand-muted sm:h-52">
                <PendingPreview file={file} />
              </div>
              <label className="mt-3 block text-[11px] font-semibold text-slate-600">
                คำอธิบายสั้น ๆ
                <Textarea
                  rows={3}
                  maxLength={1000}
                  placeholder="คำอธิบาย Floor Plan..."
                  value={pendingDescriptions[key] ?? ""}
                  onChange={(event) => onPendingDescriptionChange(key, event.target.value)}
                  className="mt-1 min-h-20 bg-white text-xs"
                />
              </label>
              <footer className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px]">
                <span className="inline-flex items-center gap-1.5 font-medium text-amber-600">
                  <span className="size-1.5 rounded-full bg-amber-400" />
                  รอบันทึก
                </span>
                <span className="text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </footer>
            </article>
          );
        })}

        {media.map((item, index) => (
          <article
            key={item.id}
            className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-primary/30 hover:shadow-md"
          >
            <header className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-brand-accent-soft text-[11px] font-bold text-brand-primary">
                  {index + 1}
                </span>
                <span className="truncate text-xs font-medium text-slate-600" title={item.name}>
                  {item.name}
                </span>
              </div>
              <button
                type="button"
                disabled={disabled}
                onClick={() => void onRemove(item.id)}
                aria-label={`ลบ ${item.name}`}
                className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
              >
                <i className="fa-regular fa-trash-can text-xs" aria-hidden="true" />
              </button>
            </header>
            <div className="h-48 overflow-hidden rounded-xl border border-slate-100 bg-brand-muted sm:h-52">
              <img src={item.url} alt={item.name} className="size-full object-contain p-5" />
            </div>
            <label className="mt-3 block text-[11px] font-semibold text-slate-600">
              คำอธิบายสั้น ๆ
              <Textarea
                rows={3}
                maxLength={1000}
                placeholder="คำอธิบาย Floor Plan..."
                value={descriptions[item.id] ?? ""}
                onChange={(event) => onDescriptionChange(item.id, event.target.value)}
                className="mt-1 min-h-20 bg-white text-xs"
              />
            </label>
            <footer className="mt-3 border-t border-slate-100 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                บันทึกแล้ว
              </span>
            </footer>
          </article>
        ))}
      </div>

      {!media.length && !files.length && (
        <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-xs text-slate-400">
          ยังไม่มีรูป Floor Plan
        </p>
      )}
    </section>
  );
}
