"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

export type ProjectGalleryItem = { src: string; alt: string; type: "image" | "video" };

export function ProjectGallery({ items }: { items: ProjectGalleryItem[] }) {
  const [active, setActive] = useState(0);
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const current = items[active];

  useEffect(() => {
    thumbnailRefs.current[active]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  if (!current) {
    return (
      <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500">
        <div className="text-center">
          <i className="fa-regular fa-images mb-3 block text-4xl text-slate-300" />
          ยังไม่มีรูป Gallery
        </div>
      </div>
    );
  }

  function move(direction: -1 | 1) {
    setActive((value) => (value + direction + items.length) % items.length);
  }

  return (
    <div
      className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-2.5 shadow-[0_18px_55px_rgba(15,23,42,0.10)] sm:p-3"
      aria-roledescription="carousel"
      aria-label="แกลเลอรีโครงการ"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") move(-1);
        if (event.key === "ArrowRight") move(1);
      }}
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-[1.15rem] bg-slate-100 sm:aspect-16/10">
        {current.type === "video" ? (
          <video
            key={current.src}
            src={current.src}
            controls
            playsInline
            preload="metadata"
            aria-label={current.alt}
            className="size-full object-cover"
          />
        ) : (
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            priority={active === 0}
            unoptimized={current.src.includes("?")}
            sizes="(min-width: 1280px) 62vw, (min-width: 1024px) 58vw, 100vw"
            className="object-cover transition-opacity duration-300"
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between bg-linear-to-b from-black/35 to-transparent p-4 pb-12 text-white">
          <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            <i className="fa-regular fa-images mr-1.5" />
            Gallery
          </span>
          <span className="rounded-full bg-black/35 px-3 py-1 text-xs font-semibold tabular-nums backdrop-blur-md">
            {active + 1} / {items.length}
          </span>
        </div>

        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="ภาพก่อนหน้า"
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-[#002D62] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:left-4 sm:size-12"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="ภาพถัดไป"
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-white/70 bg-white/90 text-[#002D62] shadow-lg backdrop-blur transition hover:scale-105 hover:bg-white sm:right-4 sm:size-12"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <div className="relative mt-3">
          <div className="gallery-thumbnails flex snap-x gap-2.5 overflow-x-auto pb-2 sm:gap-3">
            {items.map((item, index) => (
              <button
                ref={(element) => {
                  thumbnailRefs.current[index] = element;
                }}
                key={`${item.src}-${index}`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`เปิดสื่อ Gallery ลำดับที่ ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={`relative h-18 min-w-24 snap-center overflow-hidden rounded-xl border-2 bg-slate-100 transition sm:h-20 sm:min-w-28 ${
                  index === active
                    ? "border-[#F5A623] opacity-100 shadow-md"
                    : "border-transparent opacity-65 hover:opacity-100"
                }`}
              >
                {item.type === "video" ? (
                  <>
                    <video src={item.src} muted playsInline preload="metadata" className="size-full object-cover" />
                    <span className="absolute inset-0 grid place-items-center bg-black/25 text-white">
                      <i className="fa-solid fa-play grid size-8 place-items-center rounded-full bg-black/45 text-xs" />
                    </span>
                  </>
                ) : (
                  <Image
                    src={item.src}
                    alt=""
                    fill
                    unoptimized={item.src.includes("?")}
                    sizes="112px"
                    className="object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
