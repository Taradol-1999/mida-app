"use client";

import { useId, useRef, useState, type ReactNode } from "react";
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
  className = "",
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const [dragging, setDragging] = useState(false);

  function select(files: FileList | File[]) {
    const selected = Array.from(files);
    if (selected.length) onFilesChange(multiple ? selected : selected.slice(0, 1));
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-describedby={`${id}-hint`}
      onClick={() => {
        if (!disabled) inputRef.current?.click();
      }}
      onKeyDown={(event) => {
        if (!disabled && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled) select(event.dataTransfer.files);
      }}
      className={`flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-5 text-center transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary ${disabled ? "cursor-not-allowed opacity-60" : "hover:border-brand-primary hover:bg-brand-soft/45"} ${dragging ? "border-brand-primary bg-brand-soft" : "border-slate-300 bg-slate-50/70"} ${className}`}
    >
      {preview ?? <i className="fa-solid fa-cloud-arrow-up mb-2 text-xl text-brand-primary" aria-hidden="true" />}
      <p className="text-sm font-bold text-slate-700">{title}</p>
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
        className="sr-only"
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          select(event.target.files ?? []);
          event.target.value = "";
        }}
      />
    </div>
  );
}
