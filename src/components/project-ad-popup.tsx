"use client";

import { useEffect, useRef, useState } from "react";

type PopupSlide = { imageUrl: string };
type Props = { items: PopupSlide[] };

export function ProjectAdPopup({ items }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const firstImageUrl = items[0]?.imageUrl;

  useEffect(() => {
    if (!firstImageUrl) return;

    let disposed = false;
    let idleId: number | undefined;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    let preloadImage: HTMLImageElement | undefined;

    const preloadFirstPopup = () => {
      preloadImage = new Image();
      preloadImage.decoding = "async";
      preloadImage.fetchPriority = "low";
      preloadImage.onload = preloadImage.onerror = () => {
        if (!disposed) setOpen(true);
      };
      preloadImage.src = firstImageUrl;
    };

    const schedulePreload = () => {
      if (typeof window.requestIdleCallback === "function") {
        idleId = window.requestIdleCallback(preloadFirstPopup, { timeout: 2_500 });
      } else {
        fallbackTimer = globalThis.setTimeout(preloadFirstPopup, 1_200);
      }
    };

    if (document.readyState === "complete") schedulePreload();
    else window.addEventListener("load", schedulePreload, { once: true });

    return () => {
      disposed = true;
      window.removeEventListener("load", schedulePreload);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (fallbackTimer !== undefined) globalThis.clearTimeout(fallbackTimer);
      if (preloadImage) preloadImage.onload = preloadImage.onerror = null;
    };
  }, [firstImageUrl]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCurrent();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  });

  function closeCurrent() {
    if (activeIndex < items.length - 1) {
      setActiveIndex((current) => current + 1);
      return;
    }
    setOpen(false);
  }

  if (!open || !items[activeIndex]) return null;
  return (
    <div
      className="fixed inset-0 z-100 grid place-items-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[2px] sm:p-8"
      role="dialog"
      aria-modal="true"
      aria-label="Popup โฆษณาโครงการ"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCurrent();
      }}
    >
      <div className="relative flex max-h-[90vh] max-w-[min(94vw,760px)] items-center justify-center bg-transparent drop-shadow-2xl">
        {/* Popup images use their natural ratio so transparent PNG artwork is never cropped. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={items[activeIndex].imageUrl}
          src={items[activeIndex].imageUrl}
          alt={`Popup โฆษณา ${activeIndex + 1}`}
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          className="max-h-[84vh] w-auto max-w-full object-contain"
        />
        <button
          ref={closeRef}
          type="button"
          onClick={closeCurrent}
          aria-label={activeIndex < items.length - 1 ? "ปิด Popup นี้และดูรายการถัดไป" : "ปิด Popup โฆษณา"}
          className="absolute -right-2 -top-2 grid size-10 place-items-center rounded-full border-2 border-white bg-brand-primary text-lg text-white shadow-lg transition hover:bg-brand-accent hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:-right-3 sm:-top-3 sm:size-11"
        >
          <i className="fa-solid fa-xmark" aria-hidden="true" />
        </button>
        {items.length > 1 && (
          <span className="absolute bottom-2 rounded-full bg-slate-950/65 px-3 py-1 text-xs font-bold text-white">
            {activeIndex + 1} / {items.length}
          </span>
        )}
      </div>
    </div>
  );
}

