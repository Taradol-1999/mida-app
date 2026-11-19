"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { useTranslation } from "@/components/language-provider";
import "swiper/css";

export type FloorplanImage = {
  src: string;
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
  imageUrl: string | null;
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
  const imageSwiper = useRef<SwiperInstance | null>(null);
  const [houseIndex, setHouseIndex] = useState(initialHouseIndex);
  const [imageIndex, setImageIndex] = useState(0);
  const { t } = useTranslation();
  const house = items[houseIndex];
  const images = house
    ? [...(house.imageUrl ? [{ src: house.imageUrl, description: "" }] : []), ...house.floorplans]
    : [];
  const selectedImage = images[imageIndex] ?? images[0];
  const selectedDescription = selectedImage
    ? t({ th: selectedImage.description, en: selectedImage.descriptionEn ?? selectedImage.description })
    : "";

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
    if (!items[index]?.imageUrl && !items[index]?.floorplans.length) return;
    setHouseIndex(index);
    setImageIndex(0);
  }

  function selectImage(index: number) {
    const swiper = imageSwiper.current;
    if (!swiper || swiper.destroyed) {
      setImageIndex(index);
      return;
    }
    if (images.length > 1) swiper.slideToLoop(index);
    else swiper.slideTo(index);
  }

  return (
    <dialog
      ref={dialog}
      aria-label={t({ th: "แบบแปลนโครงการ", en: "Project floor plans" })}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overscroll-contain overflow-y-auto bg-slate-950/80 p-0 text-brand-text backdrop:bg-slate-950/75"
    >
      <div className="fixed inset-0 -z-10 overflow-hidden bg-stone-700" aria-hidden="true">
        {house.imageUrl && (
          <Image
            src={house.imageUrl}
            alt=""
            fill
            unoptimized
            sizes="100vw"
            className="scale-105 object-cover blur-md"
          />
        )}
        <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px]" />
      </div>

      <header className="sticky top-0 z-20 flex min-h-14 items-center justify-between gap-3 border-b border-white/15 bg-white/95 px-3 shadow-sm backdrop-blur sm:min-h-16 sm:px-8">
        <div className="min-w-0">
          <p className="truncate text-[0.55rem] font-extrabold tracking-[0.14em] text-brand-accent sm:text-[0.65rem] sm:tracking-[0.18em]">
            MIDA HOME COLLECTION
          </p>
          <h2 className="truncate text-sm font-black text-brand-primary sm:text-xl">
            {t({ th: "แบบแปลนโครงการ", en: "PROJECT FLOOR PLANS" })}
          </h2>
        </div>
        <button
          autoFocus
          type="button"
          onClick={onClose}
          aria-label={t({ th: "ปิด Floor Plan", en: "Close floor plan" })}
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-primary text-white shadow-lg transition hover:rotate-90 hover:bg-brand-accent hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary sm:size-11"
        >
          <i className="fa-solid fa-xmark text-lg" aria-hidden="true" />
        </button>
      </header>

      <div className="mx-auto grid min-h-[calc(100dvh-3.5rem)] w-full max-w-[92rem] content-start gap-3 p-3 pb-6 sm:min-h-[calc(100dvh-4rem)] sm:gap-4 sm:p-6 lg:grid-cols-[13rem_minmax(0,1fr)_15rem] lg:content-center lg:gap-5 lg:p-8">
        <aside className="order-1 min-w-0 rounded-2xl border border-white/45 bg-white/88 p-3 shadow-2xl backdrop-blur-xl">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
            {t({ th: "รูปแบบบ้าน", en: "House types" })}
          </p>
          <div className="flex snap-x gap-2 overflow-x-auto pb-1 lg:grid lg:overflow-visible">
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.imageUrl && !item.floorplans.length}
                onClick={() => selectHouse(index)}
                aria-pressed={index === houseIndex}
                className={`min-h-11 min-w-32 snap-start rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition sm:min-w-36 lg:min-w-0 ${
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

        <section className="order-2 min-w-0">
          <div className="relative aspect-4/3 touch-pan-y overflow-hidden rounded-xl border border-white/50 bg-white shadow-2xl sm:aspect-16/10 sm:rounded-2xl">
            <Swiper
              key={house.id}
              className="size-full"
              slidesPerView={1}
              loop={images.length > 1}
              speed={450}
              grabCursor={images.length > 1}
              resistanceRatio={0.65}
              onSwiper={(swiper) => {
                imageSwiper.current = swiper;
              }}
              onSlideChange={(swiper) => setImageIndex(swiper.realIndex % images.length)}
            >
              {images.map((image, index) => {
                const description = t({ th: image.description, en: image.descriptionEn ?? image.description });
                return (
                  <SwiperSlide key={`${image.src}-${index}`} className="relative size-full bg-white">
                    <Image
                      src={image.src}
                      alt={
                        description ||
                        t({ th: `แบบแปลนบ้าน ${house.name}`, en: `${house.nameEn ?? house.name} floor plan` })
                      }
                      fill
                      loading="lazy"
                      unoptimized
                      sizes="(min-width: 1024px) 60vw, 92vw"
                      className="object-contain p-2 sm:p-4"
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>
            <button
              type="button"
              onClick={() => imageSwiper.current?.slidePrev()}
              aria-label={t({ th: "รูปก่อนหน้า", en: "Previous floor plan" })}
              className="absolute left-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-brand-primary/90 text-white shadow-lg transition hover:bg-brand-accent hover:text-brand-primary disabled:hidden sm:left-3 sm:size-10"
              disabled={images.length < 2}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
            <button
              type="button"
              onClick={() => imageSwiper.current?.slideNext()}
              aria-label={t({ th: "รูปถัดไป", en: "Next floor plan" })}
              className="absolute right-2 top-1/2 z-10 grid size-9 -translate-y-1/2 place-items-center rounded-full bg-brand-primary/90 text-white shadow-lg transition hover:bg-brand-accent hover:text-brand-primary disabled:hidden sm:right-3 sm:size-10"
              disabled={images.length < 2}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </div>

          <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {images.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                onClick={() => selectImage(index)}
                aria-pressed={index === imageIndex}
                className={`w-24 flex-none snap-start overflow-hidden rounded-xl border-2 bg-white p-1 text-center shadow-md transition sm:w-32 ${
                  index === imageIndex ? "border-brand-accent" : "border-transparent opacity-75 hover:opacity-100"
                }`}
              >
                <span className="relative block h-16 overflow-hidden rounded-lg bg-brand-muted sm:h-24">
                  <Image src={image.src} alt="" fill unoptimized sizes="128px" className="object-contain p-1" />
                </span>
                {index === 0 && house.imageUrl ? (
                  <span className="mt-1.5 block px-1 text-[0.65rem] font-extrabold text-brand-primary">FACADE</span>
                ) : image.description ? (
                  <span className="mt-1.5 line-clamp-2 block px-1 text-[0.65rem] leading-4 font-bold text-brand-primary">
                    {t({ th: image.description, en: image.descriptionEn ?? image.description })}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </section>

        <aside className="order-3 rounded-2xl border border-white/45 bg-white/88 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
          <p className="text-[0.65rem] font-extrabold tracking-[0.16em] text-brand-accent">HOUSE TYPE</p>
          <h3 className="mt-1 text-2xl font-black text-brand-primary">
            {t({ th: house.name, en: house.nameEn ?? "" })}
          </h3>
          <div className="my-4 h-px bg-slate-200" />
          {selectedDescription && <p className="text-xs leading-5 text-slate-500">{selectedDescription}</p>}
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3 lg:mt-5 lg:grid-cols-1 lg:gap-3">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/55 p-3 sm:grid sm:justify-items-center sm:text-center lg:flex lg:bg-transparent lg:p-0 lg:text-left">
              <dt className="text-slate-500">
                <i className="fa-solid fa-bed mr-2 text-brand-primary" />
                {t({ th: "ห้องนอน", en: "Bedrooms" })}
              </dt>
              <dd className="font-black text-brand-primary">{house.bedrooms}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/55 p-3 sm:grid sm:justify-items-center sm:text-center lg:flex lg:bg-transparent lg:p-0 lg:text-left">
              <dt className="text-slate-500">
                <i className="fa-solid fa-bath mr-2 text-brand-primary" />
                {t({ th: "ห้องน้ำ", en: "Bathrooms" })}
              </dt>
              <dd className="font-black text-brand-primary">{house.bathrooms}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl bg-white/55 p-3 sm:grid sm:justify-items-center sm:text-center lg:flex lg:bg-transparent lg:p-0 lg:text-left">
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
