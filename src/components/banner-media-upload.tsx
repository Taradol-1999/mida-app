"use client";

/* Uploaded media uses its original URL rather than the image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { FileDropzone } from "@/components/file-dropzone";

type BannerMedia = { id: string; name: string; mimeType: string; url: string };
type Props = {
  title?: string;
  allowVideo?: boolean;
  media: BannerMedia[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemove: (id: string) => void | Promise<void>;
  disabled?: boolean;
  single?: boolean;
  allowRemoveSaved?: boolean;
  hideEmptyState?: boolean;
};

function Preview({ url, name, mimeType, compact = false }: Omit<BannerMedia, "id"> & { compact?: boolean }) {
  const className = compact ? "size-full object-cover" : "aspect-video w-full bg-brand-muted object-contain";
  return mimeType.startsWith("video/") ? (
    <video src={url} aria-label={name} controls muted playsInline preload="metadata" className={className} />
  ) : (
    <img src={url} alt={name} className={className} />
  );
}

function SelectedPreview({ file, compact = false }: { file: File; compact?: boolean }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // Object URLs are browser resources; release them when a file is removed or saved.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? (
    <Preview url={url} name={file.name} mimeType={file.type} compact={compact} />
  ) : (
    <div className={compact ? "size-full bg-brand-muted" : "aspect-video bg-brand-muted"} />
  );
}

function PendingMediaPreviews({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  return (
    <div className="mb-3 grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
      {files.map((file, index) => (
        <div
          key={`${file.name}-${file.lastModified}-${index}`}
          className="group relative min-w-0 overflow-hidden rounded-lg border border-brand-primary/15 bg-white p-1.5 text-left shadow-sm"
        >
          <div className="aspect-video overflow-hidden rounded-md bg-brand-muted">
            <SelectedPreview file={file} compact />
          </div>
          <p title={file.name} className="mt-1 truncate px-1 text-xs font-semibold text-slate-700">
            {file.name}
          </p>
          <p className="px-1 text-[0.68rem] font-medium text-brand-primary">รอบันทึก</p>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onRemove(index);
            }}
            onKeyDown={(event) => event.stopPropagation()}
            aria-label={`ยกเลิก ${file.name}`}
            className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-slate-900/70 text-white opacity-100 transition hover:bg-rose-600 sm:opacity-0 sm:group-hover:opacity-100"
          >
            <i className="fa-solid fa-xmark text-xs" aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}

export function BannerMediaUpload({
  title = "",
  allowVideo = true,
  media,
  files,
  onFilesChange,
  onRemove,
  disabled = false,
  single = false,
  allowRemoveSaved = true,
  hideEmptyState = false,
}: Props) {
  const id = useId();
  const [error, setError] = useState("");

  function selectFiles(selected: File[]) {
    const validTypes = allowVideo
      ? ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/webm"]
      : ["image/jpeg", "image/png", "image/webp"];
    const invalid = selected.find(
      (file) => !validTypes.includes(file.type) || file.size > (file.type.startsWith("video/") ? 50 : 5) * 1024 * 1024,
    );
    if (invalid) {
      setError(`ไฟล์ ${invalid.name} ไม่รองรับหรือมีขนาดเกินกำหนด`);
      return;
    }
    setError("");
    onFilesChange(single ? selected.slice(-1) : [...files, ...selected]);
  }

  return (
    <fieldset disabled={disabled} className="min-w-0 mb-4">
      <div className={`rounded-xl  bg-white`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand-primary">
              <i className="fa-solid fa-photo-film text-sm" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-700">{title}</p>
              <p id={`${id}-hint`} className="mt-0.5 text-xs text-slate-500">
                {allowVideo ? "JPG, PNG, WEBP ≤ 5 MB · MP4, WEBM ≤ 50 MB" : "JPG, PNG, WEBP · สูงสุด 5 MB"}
              </p>
            </div>
          </div>
        </div>
        <FileDropzone
          title={
            files.length ? "ไฟล์ที่เลือกรอการบันทึก" : single ? "ลากและวางไฟล์ที่นี่" : "ลากและวางไฟล์ที่นี่เพื่อเพิ่ม"
          }
          hint={allowVideo ? "JPG, PNG, WEBP ≤ 5 MB · MP4, WEBM ≤ 50 MB" : "JPG, PNG, WEBP · สูงสุด 5 MB"}
          accept={
            allowVideo ? "image/jpeg,image/png,image/webp,video/mp4,video/webm" : "image/jpeg,image/png,image/webp"
          }
          multiple={!single}
          disabled={disabled}
          className="mt-4 min-h-30"
          onFilesChange={selectFiles}
          preview={
            files.length ? (
              <PendingMediaPreviews
                files={files}
                onRemove={(index) => onFilesChange(files.filter((_, position) => position !== index))}
              />
            ) : undefined
          }
        />
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
        {media.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {media.map((item) => (
              <li
                key={item.id}
                className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2"
              >
                <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-brand-muted">
                  <Preview {...item} compact />
                </div>
                <div className="min-w-0 flex-1">
                  <p title={item.name} className="truncate text-xs font-medium text-slate-700">
                    {item.name}
                  </p>
                  <p className="mt-0.5 text-[0.68rem] text-slate-400">บันทึกแล้ว</p>
                </div>
                {allowRemoveSaved && (
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void onRemove(item.id)}
                    aria-label={`ลบ ${item.name}`}
                    className="grid size-8 shrink-0 place-items-center rounded-md text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-trash-can text-xs" aria-hidden="true" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : !hideEmptyState && !files.length ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
            {single ? "ยังไม่มีไฟล์ที่เลือก" : "ยังไม่มีไฟล์"}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
