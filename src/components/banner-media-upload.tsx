"use client";

/* Uploaded media uses its original URL rather than the image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { FileDropzone } from "@/components/file-dropzone";
import { UploadRemoveButton } from "@/components/upload-remove-button";

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
  compact?: boolean;
};

function Preview({ url, name, mimeType, compact = false }: Omit<BannerMedia, "id"> & { compact?: boolean }) {
  const className = compact ? "size-full object-contain" : "aspect-video w-full bg-brand-muted object-contain";
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

function PendingMediaPreviews({
  files,
  onRemove,
  single = false,
  compact = false,
}: {
  files: File[];
  onRemove: (index: number) => void;
  single?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`mb-3 grid w-full gap-3 ${single ? "mx-auto max-w-lg grid-cols-1" : compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
    >
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
          <UploadRemoveButton label={`ยกเลิก ${file.name}`} onRemove={() => onRemove(index)} />
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
  compact = false,
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
            files.length || media.length ? (
              <>
                {files.length > 0 && (
                  <PendingMediaPreviews
                    files={files}
                    single={single}
                    compact={compact}
                    onRemove={(index) => onFilesChange(files.filter((_, position) => position !== index))}
                  />
                )}
                {media.length > 0 && (
                  <ul
                    className={`grid w-full gap-3 text-left ${single ? "mx-auto max-w-lg grid-cols-1" : compact ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}
                  >
                    {media.map((item) => (
                      <li
                        key={item.id}
                        className="relative min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-2"
                      >
                        <div className="aspect-video overflow-hidden rounded-md bg-brand-muted">
                          <Preview {...item} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="min-w-0 flex-1">
                            <p title={item.name} className="truncate text-xs font-semibold text-slate-700">
                              {item.name}
                            </p>
                            <p className="mt-1 text-xs text-slate-400">บันทึกแล้ว</p>
                          </div>
                          {allowRemoveSaved && (
                            <UploadRemoveButton
                              label={`ลบ ${item.name}`}
                              disabled={disabled}
                              onRemove={() => onRemove(item.id)}
                            />
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : undefined
          }
        />
        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-rose-600">
            {error}
          </p>
        )}
        {!media.length && !hideEmptyState && !files.length ? (
          <p className="mt-3 rounded-lg border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400">
            {single ? "ยังไม่มีไฟล์ที่เลือก" : "ยังไม่มีไฟล์"}
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}
