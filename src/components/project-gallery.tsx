"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";

export type ProjectGalleryItem = { src: string; alt: string; type: "image" | "video" };

const tileClasses = [
  "lg:col-span-3",
  "lg:col-span-3",
  "lg:col-span-6",
  "lg:col-span-6",
  "lg:col-span-3",
  "lg:col-span-3",
];

export function ProjectGallery({ items }: { items: ProjectGalleryItem[] }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (selected === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
      if (event.key === "ArrowLeft") setSelected((value) => ((value ?? 0) - 1 + items.length) % items.length);
      if (event.key === "ArrowRight") setSelected((value) => ((value ?? 0) + 1) % items.length);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [items.length, selected]);

  if (!items.length) {
    return (
      <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500 sm:min-h-96">
        <div className="text-center">
          <i className="fa-regular fa-images mb-3 block text-4xl text-slate-300" />
          {t({ th: "ยังไม่มีรูป Gallery", en: "No gallery images yet" })}
        </div>
      </div>
    );
  }

  const current = selected === null ? null : items[selected];
  const visibleItems = expanded ? items : items.slice(0, 6);
  const move = (direction: -1 | 1) => {
    setSelected((value) => ((value ?? 0) + direction + items.length) % items.length);
  };
  const beginSwipe = (clientX: number) => {
    swipeStartX.current = clientX;
  };
  const endSwipe = (clientX: number) => {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (startX === null) return;

    const distance = clientX - startX;
    // Keep taps/clicks on the media and navigation controls working normally.
    if (Math.abs(distance) < 42) return;
    move(distance < 0 ? 1 : -1);
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-5 sm:mb-9 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="gold-rule mb-2" />
          <h2 className="section-title">{t({ th: "อัลบั้มภาพ", en: "Gallery" })}</h2>
        </div>
      </div>

      <div className="grid auto-rows-52 grid-cols-1 gap-3 sm:auto-rows-60 sm:grid-cols-2 lg:grid-cols-12">
        {visibleItems.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={t({ th: `ดูสื่อ Gallery ลำดับที่ ${index + 1}`, en: `View gallery media ${index + 1}` })}
            className={`group relative overflow-hidden bg-slate-200 text-left ${tileClasses[index % tileClasses.length]}`}
          >
            {item.type === "video" ? (
              <>
                <video
                  src={item.src}
                  muted
                  playsInline
                  preload="metadata"
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
                  <i className="fa-solid fa-play grid size-14 place-items-center rounded-full border border-white/60 bg-black/40 text-lg backdrop-blur" />
                </span>
              </>
            ) : (
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={index < 3}
                unoptimized={item.src.includes("?")}
                sizes="(min-width: 1024px) 50vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/15" />
            <span className="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-white/90 text-brand-primary opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100">
              <i className="fa-solid fa-up-right-and-down-left-from-center text-xs" />
            </span>
          </button>
        ))}
      </div>

      {items.length > 6 && (
        <div className="mt-9 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="group inline-flex min-w-44 items-center justify-center gap-2 rounded-full border border-brand-primary bg-white px-7 py-3 text-sm font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white"
          >
            {expanded ? t({ th: "แสดงน้อยลง", en: "Show less" }) : t({ th: `ดูเพิ่มเติม (${items.length - 6})`, en: `View more (${items.length - 6})` })}
            <i
              className={`fa-solid fa-chevron-down text-xs transition-transform ${expanded ? "rotate-180" : "group-hover:translate-y-0.5"}`}
              aria-hidden="true"
            />
          </button>
        </div>
      )}

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t({ th: `ภาพโครงการ ${selected! + 1} จาก ${items.length}`, en: `Project image ${selected! + 1} of ${items.length}` })}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-2 backdrop-blur-sm sm:p-4"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label={t({ th: "ปิดแกลเลอรี", en: "Close gallery" })}
            className="absolute top-3 right-3 z-10 grid size-10 place-items-center rounded-full bg-white text-slate-950 shadow-lg sm:top-5 sm:right-5 sm:size-11"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div
            className="relative h-[78vh] w-full max-w-6xl select-none sm:h-[82vh]"
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => beginSwipe(event.clientX)}
            onMouseUp={(event) => endSwipe(event.clientX)}
            onMouseLeave={() => {
              swipeStartX.current = null;
            }}
            onTouchStart={(event) => beginSwipe(event.touches[0].clientX)}
            onTouchEnd={(event) => endSwipe(event.changedTouches[0].clientX)}
            onTouchCancel={() => {
              swipeStartX.current = null;
            }}
            style={{ touchAction: "pan-y" }}
          >
            <div className="size-full overflow-hidden rounded-xl">
              <div
                className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
                style={{ transform: `translateX(-${selected! * 100}%)` }}
              >
                {items.map((item, index) => (
                  <div key={`${item.src}-${index}`} className="relative h-full w-full shrink-0">
                    {item.type === "video" ? (
                      <video
                        src={item.src}
                        controls
                        autoPlay={index === selected}
                        playsInline
                        className="size-full object-contain"
                      />
                    ) : (
                      <Image
                        src={item.src}
                        alt={item.alt}
                        fill
                        priority={index === selected}
                        unoptimized={item.src.includes("?")}
                        sizes="100vw"
                        className="object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label={t({ th: "ภาพก่อนหน้า", en: "Previous image" })}
                  className="absolute top-1/2 left-2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-lg sm:-left-16 sm:size-12"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label={t({ th: "ภาพถัดไป", en: "Next image" })}
                  className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-lg sm:-right-16 sm:size-12"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </>
            )}
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white">
              {selected! + 1} / {items.length}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
