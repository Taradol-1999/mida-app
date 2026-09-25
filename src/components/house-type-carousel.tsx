"use client";

import Image from "next/image";
import { useState } from "react";

export type HouseTypeItem = {
  id: string;
  name: string;
  description: string;
  bedrooms: number | string;
  bathrooms: number | string;
  usableArea: number | string;
  startingPrice: number | null;
  imageUrl: string | null;
};

export function HouseTypeCarousel({ items }: { items: HouseTypeItem[] }) {
  const [active, setActive] = useState(0);

  function move(direction: -1 | 1) {
    setActive((value) => (value + direction + items.length) % items.length);
  }

  return (
    <div className="relative mt-7 overflow-hidden pb-4 sm:mt-10">
      <div className="relative mx-auto h-100 max-w-7xl sm:h-110 md:h-135">
        {items.map((house, index) => {
          let offset = index - active;
          if (offset > items.length / 2) offset -= items.length;
          if (offset < -items.length / 2) offset += items.length;
          const distance = Math.abs(offset);
          return (
            <article
              key={house.id}
              className="absolute top-0 left-1/2 h-96 w-[88%] overflow-hidden rounded-2xl bg-brand-primary shadow-2xl transition-all duration-500 sm:h-105 sm:rounded-3xl md:h-130 md:w-[48%]"
              style={{
                transform: `translateX(calc(-50% + ${offset * 52}%)) scale(${distance === 0 ? 1 : 0.86})`,
                zIndex: 20 - distance,
                opacity: distance > 1 ? 0 : distance === 0 ? 1 : 0.78,
                pointerEvents: distance > 1 ? "none" : "auto",
              }}
            >
              {house.imageUrl ? (
                <Image
                  src={house.imageUrl}
                  alt={`แบบบ้าน ${house.name}`}
                  fill
                  unoptimized
                  sizes="(min-width: 768px) 50vw, 90vw"
                  className="object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center bg-linear-to-br from-brand-text to-brand-primary text-white/70">
                  <i className="fa-solid fa-house-chimney text-6xl" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black via-black/25 to-black/10" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6 md:p-8">
                <p className="text-xs font-bold tracking-widest text-white/70">HOUSE TYPE</p>
                <h3 className="mt-2 text-xl font-black sm:text-2xl md:text-3xl">{house.name}</h3>
                {house.description && (
                  <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-white/80">{house.description}</p>
                )}
                <p className="mt-3 text-sm text-white/80">
                  {house.bedrooms} ห้องนอน · {house.bathrooms} ห้องน้ำ · {house.usableArea} ตร.ม.
                </p>
                <p className="mt-4 text-lg font-extrabold text-white">
                  {house.startingPrice === null
                    ? "สอบถามราคาโครงการ"
                    : `เริ่ม ${house.startingPrice.toLocaleString("th-TH")} บาท`}
                </p>
              </div>
            </article>
          );
        })}
      </div>
      {items.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="แบบบ้านก่อนหน้า"
            className="absolute top-1/2 left-2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-primary shadow-xl sm:left-3 sm:size-14 md:left-[8%]"
          >
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="แบบบ้านถัดไป"
            className="absolute top-1/2 right-2 z-30 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-primary shadow-xl sm:right-3 sm:size-14 md:right-[8%]"
          >
            <i className="fa-solid fa-chevron-right" />
          </button>
        </>
      )}
    </div>
  );
}
