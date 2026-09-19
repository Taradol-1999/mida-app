"use client";

import Image from "next/image";
import { useState } from "react";

export type ProjectGalleryItem = { src: string; alt: string; type: "image" | "video" };

export function ProjectGallery({ items }: { items: ProjectGalleryItem[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  if (!current) {
    return (
      <div className="grid min-h-96 place-items-center rounded-2xl bg-slate-200 text-sm font-semibold text-slate-500">
        ยังไม่มีรูป Gallery
      </div>
    );
  }

  function move(direction: -1 | 1) {
    setActive((value) => (value + direction + items.length) % items.length);
  }

  return (
    <div>
      <div className="relative aspect-16/10 overflow-hidden rounded-2xl bg-slate-200 shadow-sm">
        {current.type === "video" ? (
          <video src={current.src} controls playsInline className="size-full object-cover" />
        ) : (
          <Image
            src={current.src}
            alt={current.alt}
            fill
            unoptimized={current.src.includes("?")}
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        )}
        {items.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="ภาพก่อนหน้า"
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#002D62] shadow"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="ภาพถัดไป"
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#002D62] shadow"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </>
        )}
      </div>
      {items.length > 1 && (
        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
          {items.map((item, index) => (
            <button
              key={`${item.src}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`เปิดสื่อ Gallery ลำดับที่ ${index + 1}`}
              className={`relative h-20 min-w-28 overflow-hidden rounded-xl border-2 ${index === active ? "border-[#F5A623]" : "border-transparent opacity-70"}`}
            >
              {item.type === "video" ? (
                <span className="grid size-full place-items-center bg-[#001B3D] text-white">
                  <i className="fa-solid fa-play" />
                </span>
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
      )}
    </div>
  );
}
