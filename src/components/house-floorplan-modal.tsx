"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";

export type FloorplanImage = {
  src: string;
  title: string;
  description: string;
  descriptionEn?: string;
};

export type FloorplanHouse = {
  id: string;
  name: string;
  nameEn?: string | null;
  bedrooms: number | string;
  bathrooms: number | string;
  usableArea: number | string;
  floorplans: FloorplanImage[];
};

export function HouseFloorplanModal({
  items,
  initialHouseIndex,
  onClose,
}: {
  items: FloorplanHouse[];
  initialHouseIndex: number;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [houseIndex, setHouseIndex] = useState(initialHouseIndex);
  const [imageIndex, setImageIndex] = useState(0);
  const { t } = useTranslation();
  const house = items[houseIndex];
  const images = house?.floorplans ?? [];
  const selectedImage = images[imageIndex] ?? images[0];

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

  if (!house || !selectedImage) return null;

  function selectHouse(index: number) {
    if (!items[index]?.floorplans.length) return;
    setHouseIndex(index);
    setImageIndex(0);
  }

  return (
    <dialog
      ref={dialog}
      aria-label={t({ th: "แบบแปลนโครงการ", en: "Project floor plans" })}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto bg-slate-950/80 p-0 text-brand-text backdrop:bg-slate-950/75"
    >
      <div
        className="fixed inset-0 -z-10 bg-linear-to-br from-brand-primary via-brand-deep to-slate-950"
        aria-hidden="true"
      />

      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/15 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-8">
        <div>
          <p className="text-[0.65rem] font-extrabold tracking-[0.18em] text-brand-accent">MIDA HOME COLLECTION</p>
          <h2 className="text-base font-black text-brand-primary sm:text-xl">
            {t({ th: "แบบแปลนโครงการ", en: "PROJECT FLOOR PLANS" })}
          </h2>
        </div>
        <button
          autoFocus
          type="button"
          onClick={onClose}
          aria-label={t({ th: "ปิด Floor Plan", en: "Close floor plan" })}
          className="grid size-11 place-items-center rounded-full bg-brand-primary text-white shadow-lg transition hover:rotate-90 hover:bg-brand-accent hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary"
        >
          <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
        </button>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-[92rem] content-center gap-4 p-4 sm:p-6 lg:grid-cols-[13rem_minmax(0,1fr)_15rem] lg:gap-5 lg:p-8">
        <aside className="order-2 rounded-2xl border border-white/45 bg-white/88 p-3 shadow-2xl backdrop-blur-xl lg:order-1">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {t({ th: "รูปแบบบ้าน", en: "House types" })}
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.floorplans.length}
                onClick={() => selectHouse(index)}
                aria-pressed={index === houseIndex}
                className={`min-w-36 rounded-xl border px-3 py-3 text-left text-sm font-bold transition lg:min-w-0 ${
                  index === houseIndex
                    ? "border-brand-accent bg-brand-accent-soft text-brand-primary shadow-sm"
                    : "border-slate-200 bg-white/65 text-slate-600 hover:border-brand-primary/30 hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                }`}
              >
                {t({ th: item.name, en: item.nameEn ?? "" })}
                {index === houseIndex && (
                  <i className="fa-solid fa-circle-check float-right mt-0.5 text-brand-accent" />
                )}
              </button>
            ))}
          </div>
        </aside>

        <section className="order-1 min-w-0 lg:order-2">
          <div className="relative aspect-4/3 overflow-hidden rounded-2xl border border-white/50 bg-white shadow-2xl sm:aspect-16/10">
            <Image
              key={selectedImage.src}
              src={selectedImage.src}
              alt={selectedImage.title}
              fill
              loading="lazy"
              unoptimized
              sizes="(min-width: 1024px) 60vw, 92vw"
              className="object-contain p-2 sm:p-4"
            />
            <button
              type="button"
              onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}
              aria-label={t({ th: "รูปก่อนหน้า", en: "Previous floor plan" })}
              className="absolute left-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-brand-primary/90 text-white shadow-lg transition hover:bg-brand-accent hover:text-brand-primary disabled:hidden"
              disabled={images.length < 2}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              type="button"
              onClick={() => setImageIndex((imageIndex + 1) % images.length)}
              aria-label={t({ th: "รูปถัดไป", en: "Next floor plan" })}
              className="absolute right-3 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-brand-primary/90 text-white shadow-lg transition hover:bg-brand-accent hover:text-brand-primary disabled:hidden"
              disabled={images.length < 2}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2">
            {images.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-pressed={index === imageIndex}
                className={`min-w-28 snap-start overflow-hidden rounded-xl border-2 bg-white p-1 text-left shadow-md transition ${
                  index === imageIndex ? "border-brand-accent" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <span className="relative block aspect-16/10 overflow-hidden rounded-lg bg-brand-muted">
                  <Image src={image.src} alt="" fill unoptimized sizes="112px" className="object-cover" />
                </span>
                <span className="mt-1.5 block truncate px-1 text-[0.65rem] font-extrabold text-brand-primary">
                  {image.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        <aside className="order-3 rounded-2xl border border-white/45 bg-white/88 p-5 shadow-2xl backdrop-blur-xl">
          <p className="text-[0.65rem] font-extrabold tracking-[0.16em] text-brand-accent">HOUSE TYPE</p>
          <h3 className="mt-1 text-2xl font-black text-brand-primary">
            {t({ th: house.name, en: house.nameEn ?? "" })}
          </h3>
          <div className="my-4 h-px bg-slate-200" />
          <p className="text-sm font-extrabold text-slate-800">{selectedImage.title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {t({ th: selectedImage.description, en: selectedImage.descriptionEn ?? selectedImage.description })}
          </p>
          <dl className="mt-5 grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                <i className="fa-solid fa-bed mr-2 text-brand-primary" />
                {t({ th: "ห้องนอน", en: "Bedrooms" })}
              </dt>
              <dd className="font-black text-brand-primary">{house.bedrooms}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                <i className="fa-solid fa-bath mr-2 text-brand-primary" />
                {t({ th: "ห้องน้ำ", en: "Bathrooms" })}
              </dt>
              <dd className="font-black text-brand-primary">{house.bathrooms}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-500">
                <i className="fa-solid fa-ruler-combined mr-2 text-brand-primary" />
                {t({ th: "พื้นที่ใช้สอย", en: "Usable area" })}
              </dt>
              <dd className="font-black text-brand-primary">
                {house.usableArea} {t({ th: "ตร.ม.", en: "sq.m." })}
              </dd>
            </div>
          </dl>
        </aside>
      </div>
    </dialog>
  );
}
