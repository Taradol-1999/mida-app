"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/form-controls";

type FileDropzoneProps = {
  title: string;
  hint: string;
  accept: string;
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
  multiple?: boolean;
  fileName?: string;
  preview?: ReactNode;
  file?: File | null;
  className?: string;
};

export function FileDropzone({
  title,
  hint,
  accept,
  onFilesChange,
  disabled = false,
  multiple = false,
  fileName,
  preview,
  file,
  className = "",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [dragging, setDragging] = useState(false);
  const [fileUrl, setFileUrl] = useState("");

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // The URL belongs to this selected file and is released on replacement/unmount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const selectedPreview =
    file && fileUrl && file.type.startsWith("image/") ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={fileUrl} alt={`ตัวอย่าง ${file.name}`} className="mx-auto h-36 max-w-full rounded-lg object-contain" />
    ) : (
      preview
    );

  function select(files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length) onFilesChange(multiple ? selected : selected.slice(0, 1));
  }

  return (
    <div
      role="group"
      aria-label={title}
      aria-disabled={disabled}
      aria-describedby={`${id}-hint`}
      onClick={(event) => {
        if (!disabled && !(event.target as HTMLElement).closest("button, a, input, video")) inputRef.current?.click();
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) select(event.dataTransfer.files);
      }}
      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand-primary hover:bg-brand-soft/45"} ${dragging ? "border-brand-primary bg-brand-soft" : "border-slate-300 bg-slate-50/70"} ${className}`}
    >
      {selectedPreview && <div className="mb-4 w-full min-w-0 [&_img]:mx-auto">{selectedPreview}</div>}
      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="inline-flex max-w-full flex-col items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:cursor-not-allowed"
      >
        <i className="fa-solid fa-cloud-arrow-up text-xl text-brand-primary" aria-hidden="true" />
        {title}
      </button>
      <p className="mt-1 text-xs text-slate-500">ลากและวางไฟล์ที่นี่ หรือคลิกเพื่อเลือกไฟล์</p>
      <p id={`${id}-hint`} className="mt-1 text-xs text-slate-400">
        {hint}
      </p>
      {fileName && (
        <p className="mt-3 max-w-full truncate rounded-md bg-white px-2 py-1 text-xs font-medium text-brand-primary">
          {fileName}
        </p>
      )}
      <Input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        aria-label={title}
        tabIndex={-1}
        className="hidden"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          select(event.target.files ?? []);
          event.target.value = "";
        }}
      />
    </div>
  );
}
