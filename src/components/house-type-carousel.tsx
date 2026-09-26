"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";

export type HouseTypeItem = {
  id: string;
  name: string;
  nameEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  bedrooms: number | string;
  bathrooms: number | string;
  usableArea: number | string;
  startingPrice: number | null;
  imageUrl: string | null;
};

export function HouseTypeCarousel({ items }: { items: HouseTypeItem[] }) {
  const [active, setActive] = useState(0);
  const { language, t } = useTranslation();
  const dragStartX = useRef<number | null>(null);
  const didDrag = useRef(false);

  function move(direction: -1 | 1) {
    setActive((value) => (value + direction + items.length) % items.length);
  }

  function finishDrag(clientX: number) {
    if (dragStartX.current === null) return;
    const distance = clientX - dragStartX.current;
    dragStartX.current = null;
    if (Math.abs(distance) < 48) return;
    didDrag.current = true;
    move(distance < 0 ? 1 : -1);
  }

  function startDrag(clientX: number) {
    if (items.length <= 1) return;
    didDrag.current = false;
    dragStartX.current = clientX;
  }

  return (
    <section className="relative left-1/2 mt-7 w-screen -translate-x-1/2 overflow-hidden border-y border-brand-primary/10 bg-linear-to-br from-brand-primary via-[#063f82] to-brand-text p-4 shadow-2xl sm:mt-9 sm:p-6 md:p-8">
      <span
        className="absolute -top-28 -right-20 size-80 rounded-full bg-brand-accent/20 blur-3xl"
        aria-hidden="true"
      />
      <span
        className="absolute -bottom-32 -left-24 size-72 rounded-full border-[2rem] border-white/5"
        aria-hidden="true"
      />

      <div className="relative mx-auto w-full max-w-[160rem] sm:w-[calc(100%-2rem)] xl:w-[calc(100%-16rem)]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/15 pb-4 text-white sm:pb-5">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA HOME COLLECTION</p>
            <p className="mt-1 text-sm text-white/75">{t({ th: "เลือกแบบบ้านที่ลงตัวกับทุกจังหวะชีวิต", en: "Choose the home type that fits every moment of your life." })}</p>
            {items.length > 1 && (
              <p className="mt-1.5 text-xs font-semibold text-white/60 md:hidden">
                <i className="fa-solid fa-hand-pointer mr-1.5 text-brand-accent" aria-hidden="true" />
                {t({ th: "ปัดซ้าย–ขวาเพื่อดูแบบบ้าน", en: "Swipe left or right to view home types." })}
              </p>
            )}
          </div>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-sm">
            {active + 1} / {items.length} {t({ th: "แบบบ้าน", en: "home types" })}
          </span>
        </div>

        <div
          className="relative mt-5 h-86 cursor-grab select-none active:cursor-grabbing sm:h-105 md:mt-7 md:h-116"
          style={{ touchAction: "pan-y" }}
          // Use native mouse/touch events instead of Pointer Capture: iOS Safari
          // may cancel captured pointer gestures when the page itself scrolls.
          onMouseDown={(event) => startDrag(event.clientX)}
          onMouseUp={(event) => finishDrag(event.clientX)}
          onMouseLeave={() => {
            dragStartX.current = null;
          }}
          onTouchStart={(event) => {
            startDrag(event.touches[0]?.clientX ?? 0);
          }}
          onTouchEnd={(event) => {
            finishDrag(event.changedTouches[0]?.clientX ?? 0);
          }}
          onTouchCancel={() => {
            dragStartX.current = null;
          }}
        >
          {items.length > 1 && (
            <>
              <button
                type="button"
                aria-label={t({ th: "เลื่อนดูแบบบ้านก่อนหน้า", en: "Previous home type" })}
                onClick={(event) => {
                  event.stopPropagation();
                  move(-1);
                }}
                className="absolute inset-y-0 left-0 z-10 w-[10%] cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-accent md:w-[18%]"
              />
              <button
                type="button"
                aria-label={t({ th: "เลื่อนดูแบบบ้านถัดไป", en: "Next home type" })}
                onClick={(event) => {
                  event.stopPropagation();
                  move(1);
                }}
                className="absolute inset-y-0 right-0 z-10 w-[10%] cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-brand-accent md:w-[18%]"
              />
            </>
          )}
          {items.map((house, index) => {
            let offset = index - active;
            if (offset > items.length / 2) offset -= items.length;
            if (offset < -items.length / 2) offset += items.length;
            const distance = Math.abs(offset);
            return (
              <article
                key={house.id}
                role="button"
                tabIndex={0}
                aria-label={`${t({ th: "เลือกแบบบ้าน", en: "Select house type" })} ${t({ th: house.name, en: house.nameEn ?? "" })}`}
                aria-current={index === active ? "true" : undefined}
                onClick={() => {
                  if (didDrag.current) {
                    didDrag.current = false;
                    return;
                  }
                  setActive(index);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setActive(index);
                  }
                }}
                className={`absolute top-0 left-1/2 h-76 w-[88%] cursor-pointer overflow-hidden rounded-2xl bg-brand-primary shadow-2xl ring-1 ring-white/15 transition-all duration-500 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-accent sm:h-94 sm:rounded-3xl md:h-108 md:w-[54%] ${distance === 0 ? "block" : "hidden md:block"}`}
                style={{
                  transform: `translateX(calc(-50% + ${offset * 58}%)) scale(${distance === 0 ? 1 : 0.84})`,
                  zIndex: 20 - distance,
                  opacity: distance > 1 ? 0 : distance === 0 ? 1 : 0.68,
                  pointerEvents: distance > 1 ? "none" : "auto",
                }}
              >
                {house.imageUrl ? (
                  <Image
                    src={house.imageUrl}
                    alt={`${t({ th: "แบบบ้าน", en: "House type" })} ${t({ th: house.name, en: house.nameEn ?? "" })}`}
                    fill
                    unoptimized
                    sizes="(min-width: 768px) 55vw, 90vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center bg-linear-to-br from-brand-text to-brand-primary text-white/70">
                    <i className="fa-solid fa-house-chimney text-6xl" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5 md:p-7">
                  <p className="text-[0.65rem] font-bold tracking-[0.2em] text-brand-accent">HOUSE TYPE</p>
                  <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
                  <h3 className="text-2xl font-black sm:text-3xl md:text-4xl">{t({ th: house.name, en: house.nameEn ?? "" })}</h3>
                    <p className="rounded-full bg-brand-accent px-3 py-1.5 text-sm font-extrabold text-brand-primary shadow-lg">
                      {house.startingPrice === null
                        ? t({ th: "สอบถามราคา", en: "Price on request" })
                        : language === "en"
                          ? `From THB ${house.startingPrice.toLocaleString("en-US")}`
                          : `เริ่ม ${house.startingPrice.toLocaleString("th-TH")} บาท`}
                    </p>
                  </div>
                  {house.description && (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-xs leading-5 text-white/85 sm:text-sm sm:leading-6">
                      {t({ th: house.description, en: house.descriptionEn ?? "" })}
                    </p>
                  )}
                  <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-white/15 bg-black/25 p-2 text-center text-xs font-semibold backdrop-blur-sm sm:max-w-md">
                    <span>
                      <b className="block text-sm text-white">{house.bedrooms}</b>{t({ th: "ห้องนอน", en: "Bedrooms" })}
                    </span>
                    <span className="border-x border-white/15">
                      <b className="block text-sm text-white">{house.bathrooms}</b>{t({ th: "ห้องน้ำ", en: "Bathrooms" })}
                    </span>
                    <span>
                      <b className="block text-sm text-white">{house.usableArea}</b>{t({ th: "ตร.ม.", en: "sq.m." })}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {items.length > 1 && (
          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none [&::-webkit-scrollbar]:hidden sm:justify-center">
            {items.map((house, index) => (
              <button
                key={house.id}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`${t({ th: "เลือกแบบบ้าน", en: "Select house type" })} ${t({ th: house.name, en: house.nameEn ?? "" })}`}
                aria-current={index === active ? "true" : undefined}
                className={`flex shrink-0 snap-start items-center gap-2 rounded-xl border px-2 py-2 text-left text-xs font-bold transition ${index === active ? "border-brand-accent bg-white text-brand-primary shadow-lg" : "border-white/15 bg-white/10 text-white/75 hover:bg-white/20"}`}
              >
                <span className="relative size-9 overflow-hidden rounded-lg bg-brand-muted">
                  {house.imageUrl ? (
                    <Image src={house.imageUrl} alt="" fill unoptimized sizes="36px" className="object-cover" />
                  ) : (
                    <i className="fa-solid fa-house absolute inset-0 grid place-items-center text-brand-primary" />
                  )}
                </span>
                {t({ th: house.name, en: house.nameEn ?? "" })}
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
