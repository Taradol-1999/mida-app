"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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
      <div className="grid min-h-96 place-items-center rounded-3xl border border-dashed border-slate-300 bg-white text-sm font-semibold text-slate-500">
        <div className="text-center">
          <i className="fa-regular fa-images mb-3 block text-4xl text-slate-300" />
          ยังไม่มีรูป Gallery
        </div>
      </div>
    );
  }

  const current = selected === null ? null : items[selected];
  const move = (direction: -1 | 1) => {
    setSelected((value) => ((value ?? 0) + direction + items.length) % items.length);
  };

  return (
    <>
      <div className="mb-9 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="mb-3 block h-1 w-14 rounded-full bg-[#F5A623]" />
          <h2 className="text-3xl font-extrabold text-slate-950 md:text-4xl">อัลบั้มภาพ</h2>
        </div>
        <div className="flex justify-start sm:justify-end">
          <span className="min-w-56 rounded-full bg-black px-8 py-3 text-center text-sm font-bold text-white md:min-w-72">
            ภาพโครงการ
          </span>
        </div>
      </div>

      <div className="grid auto-rows-[15rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {items.map((item, index) => (
          <button
            key={`${item.src}-${index}`}
            type="button"
            onClick={() => setSelected(index)}
            aria-label={`ดูสื่อ Gallery ลำดับที่ ${index + 1}`}
            className={`group relative overflow-hidden bg-slate-200 text-left ${tileClasses[index % tileClasses.length]} ${index === 0 ? "rounded-tl-2xl" : ""} ${index === 2 ? "rounded-tr-2xl" : ""}`}
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
            <span className="absolute bottom-3 right-3 grid size-9 translate-y-2 place-items-center rounded-full bg-white/90 text-[#002D62] opacity-0 shadow transition group-hover:translate-y-0 group-hover:opacity-100">
              <i className="fa-solid fa-up-right-and-down-left-from-center text-xs" />
            </span>
          </button>
        ))}
      </div>

      {current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`ภาพโครงการ ${selected! + 1} จาก ${items.length}`}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="ปิดแกลเลอรี"
            className="absolute right-5 top-5 z-10 grid size-11 place-items-center rounded-full bg-white text-slate-950 shadow-lg"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="relative h-[82vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            {current.type === "video" ? (
              <video src={current.src} controls autoPlay playsInline className="size-full object-contain" />
            ) : (
              <Image
                src={current.src}
                alt={current.alt}
                fill
                unoptimized={current.src.includes("?")}
                sizes="100vw"
                className="object-contain"
              />
            )}
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => move(-1)}
                  aria-label="ภาพก่อนหน้า"
                  className="absolute left-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#002D62] shadow-lg sm:-left-16"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  onClick={() => move(1)}
                  aria-label="ภาพถัดไป"
                  className="absolute right-2 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#002D62] shadow-lg sm:-right-16"
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
