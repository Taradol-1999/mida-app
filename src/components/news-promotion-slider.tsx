"use client";

import { useRef } from "react";

export type NewsPromotionItem = [tag: string, title: string, detail: string];

export function NewsPromotionSlider({ items }: { items: NewsPromotionItem[] }) {
  const trackRef = useRef<HTMLDivElement>(null);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: "smooth" });
  }

  return (
    <div className="relative mt-7">
      <div className="absolute -top-16 right-0 flex gap-2">
        <button
          type="button"
          onClick={() => move(-1)}
          aria-label="ข่าวก่อนหน้า"
          className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-[#002D62] shadow-sm transition hover:border-[#002D62] hover:bg-[#002D62] hover:text-white"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => move(1)}
          aria-label="ข่าวถัดไป"
          className="grid size-10 place-items-center rounded-full bg-[#002D62] text-white shadow-sm transition hover:bg-[#F5A623]"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button>
      </div>

      <div
        ref={trackRef}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map(([tag, title, detail], index) => (
          <article
            key={`${tag}-${title}-${index}`}
            className="min-w-[88%] snap-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[calc(50%-0.625rem)] lg:min-w-[calc(33.333%-0.875rem)]"
          >
            <p className="text-xs font-extrabold text-[#F5A623]">{tag}</p>
            <h3 className="mt-3 text-xl font-extrabold text-[#002D62]">{title}</h3>
            <p className="mt-3 line-clamp-4 text-sm leading-6 text-slate-500">{detail}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
