"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useTranslation } from "@/components/language-provider";
import type { ProjectGalleryItem } from "@/components/project-gallery";

export function FullscreenMediaViewer({
  items,
  index,
  onIndexChange,
  onClose,
}: {
  items: ProjectGalleryItem[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const swipeStart = useRef<number | null>(null);
  const { t } = useTranslation();
  const item = items[index];

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element.showModal();
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);

  if (!item) return null;
  const move = (direction: -1 | 1) => onIndexChange((index + direction + items.length) % items.length);

  return (
    <dialog
      ref={dialog}
      aria-label={t({ th: "ดูรูปจุดเด่นทำเลโครงการเต็มหน้าจอ", en: "Fullscreen location gallery" })}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={(event) => {
        // Strict Mode reopens the dialog after effect cleanup; ignore that queued close event.
        if (!event.currentTarget.open) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault();
          move(event.key === "ArrowLeft" ? -1 : 1);
        }
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-slate-950 p-0 text-white backdrop:bg-slate-950/95"
    >
      <div className="relative flex h-full w-full flex-col">
        <div className="flex min-h-16 shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
          <p className="min-w-0 truncate text-sm font-semibold">{item.alt}</p>
          <button
            autoFocus
            type="button"
            onClick={onClose}
            aria-label={t({ th: "ปิดรูปภาพ", en: "Close image" })}
            className="grid size-11 shrink-0 place-items-center rounded-full bg-white/15 transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
          >
            <i className="fa-solid fa-xmark text-xl" aria-hidden="true" />
          </button>
        </div>
        <div
          className="relative min-h-0 flex-1"
          onTouchStart={(event) => {
            swipeStart.current = event.touches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = swipeStart.current;
            swipeStart.current = null;
            const end = event.changedTouches[0]?.clientX;
            if (start !== null && end !== undefined && Math.abs(end - start) > 48) move(end < start ? 1 : -1);
          }}
          onTouchCancel={() => {
            swipeStart.current = null;
          }}
        >
          {item.type === "video" ? (
            <video
              key={item.src}
              src={item.src}
              controls
              playsInline
              className="size-full object-contain px-12 sm:px-16"
            />
          ) : (
            <Image
              key={item.src}
              src={item.src}
              alt={item.alt}
              fill
              unoptimized
              sizes="100vw"
              className="object-contain px-12 sm:px-16"
            />
          )}
          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label={t({ th: "รูปก่อนหน้า", en: "Previous image" })}
                className="absolute left-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white sm:left-4 sm:size-11"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label={t({ th: "รูปถัดไป", en: "Next image" })}
                className="absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/15 hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white sm:right-4 sm:size-11"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
        <p aria-live="polite" className="shrink-0 px-4 py-5 text-center text-sm tabular-nums text-white/80">
          {index + 1} / {items.length}
        </p>
      </div>
    </dialog>
  );
}
