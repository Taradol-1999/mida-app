"use client";

/* Uploaded media uses its original URL rather than the image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useId, useState } from "react";
import { Input } from "@/components/ui/form-controls";

type BannerMedia = { id: string; name: string; mimeType: string; url: string };
type Props = {
  title?: string;
  allowVideo?: boolean;
  media: BannerMedia[];
  files: File[];
  onFilesChange: (files: File[]) => void;
  onRemove: (id: string) => void | Promise<void>;
  disabled?: boolean;
};

function Preview({ url, name, mimeType }: Omit<BannerMedia, "id">) {
  return mimeType.startsWith("video/") ? (
    <video
      src={url}
      aria-label={name}
      controls
      muted
      playsInline
      preload="metadata"
      className="aspect-video w-full bg-brand-overlay object-contain"
    />
  ) : (
    <img src={url} alt={name} className="aspect-video w-full bg-brand-muted object-contain" />
  );
}

function SelectedPreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    // Object URLs are browser resources; release them when a file is removed or saved.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url ? (
    <Preview url={url} name={file.name} mimeType={file.type} />
  ) : (
    <div className="aspect-video bg-brand-muted" />
  );
}

export function BannerMediaUpload({
  title = "รูปภาพหรือวิดีโอสไลด์แบนเนอร์หลัก",
  allowVideo = true,
  media,
  files,
  onFilesChange,
  onRemove,
  disabled = false,
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
    onFilesChange([...files, ...selected]);
  }

  return (
    <fieldset disabled={disabled} className="min-w-0">
      <legend className="text-sm font-bold text-brand-text">{title}</legend>
      <div className="mt-2 rounded-2xl border-2 border-dashed border-brand-primary/25 bg-brand-muted p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-accent-soft text-brand-primary">
              <i className="fa-solid fa-photo-film text-xl" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-brand-primary">
                {allowVideo ? "แบนเนอร์รูปภาพและวิดีโอ" : "รูปภาพประกอบ"}
              </p>
              <p className="mt-1 text-xs text-brand-text">
                บันทึกแล้ว {media.length} ไฟล์ · รอบันทึก {files.length} ไฟล์
              </p>
            </div>
          </div>
          <label
            className={`relative rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-brand-surface focus-within:ring-2 focus-within:ring-brand-accent focus-within:ring-offset-2 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
          >
            <i className="fa-solid fa-plus mr-2" aria-hidden="true" />
            {allowVideo ? "เพิ่มรูปภาพ / วิดีโอ" : "เพิ่มรูปภาพ"}
            <Input
              type="file"
              aria-label={title}
              aria-describedby={`${id}-hint`}
              multiple
              accept={
                allowVideo ? "image/jpeg,image/png,image/webp,video/mp4,video/webm" : "image/jpeg,image/png,image/webp"
              }
              className="sr-only"
              onChange={(event) => {
                selectFiles(Array.from(event.target.files ?? []));
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <p id={`${id}-hint`} className="mt-3 text-xs text-brand-text">
          {allowVideo
            ? "JPG, PNG, WEBP ไม่เกิน 5 MB · MP4, WEBM ไม่เกิน 50 MB ต่อไฟล์ · เลือกได้หลายไฟล์"
            : "JPG, PNG, WEBP ไม่เกิน 5 MB ต่อไฟล์ · เลือกได้หลายไฟล์"}
        </p>
        {error && (
          <p role="alert" className="mt-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        {media.length + files.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {media.map((item) => (
              <div
                key={item.id}
                className="min-w-0 overflow-hidden rounded-xl border border-brand-primary/15 bg-brand-surface"
              >
                <Preview {...item} />
                <div className="flex items-center gap-2 p-3">
                  <p title={item.name} className="min-w-0 flex-1 truncate text-xs text-brand-text">
                    {item.name}
                  </p>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void onRemove(item.id)}
                    aria-label={`ลบ ${item.name}`}
                    className="rounded-md px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-trash-can" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="min-w-0 overflow-hidden rounded-xl border border-brand-accent bg-brand-surface"
              >
                <SelectedPreview file={file} />
                <div className="flex items-center gap-2 p-3">
                  <div className="min-w-0 flex-1">
                    <p title={file.name} className="truncate text-xs text-brand-text">
                      {file.name}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-brand-primary">รอบันทึก</p>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => onFilesChange(files.filter((_, position) => position !== index))}
                    aria-label={`ยกเลิก ${file.name}`}
                    className="rounded-md px-2 py-1 text-rose-600 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-brand-surface p-8 text-center text-sm text-brand-text">
            {allowVideo ? "ยังไม่มีแบนเนอร์ เพิ่มรูปภาพหรือวิดีโอเพื่อแสดงตัวอย่างที่นี่" : "ยังไม่มีรูปภาพประกอบ"}
          </p>
        )}
      </div>
    </fieldset>
  );
}
