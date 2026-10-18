"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import { useTranslation } from "@/components/language-provider";
import "swiper/css";

export function BlogImageSlider({ images }: { images: { src: string; alt: string }[] }) {
  const swiper = useRef<SwiperInstance | null>(null);
  const [current, setCurrent] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const { t } = useTranslation();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (expanded && !element.open) element.showModal();
    if (!expanded && element.open) element.close();
  }, [expanded]);
  if (!images.length) return null;
  return (
    <div className="relative bg-slate-100">
      <Swiper
        onSwiper={(instance) => {
          swiper.current = instance;
        }}
        onSlideChange={(instance) => setCurrent(instance.realIndex)}
        loop={images.length > 1}
        speed={450}
      >
        {images.map((image, index) => (
          <SwiperSlide key={image.src}>
            <button
              type="button"
              onClick={() => {
                setCurrent(index);
                setExpanded(true);
              }}
              aria-label={t({ th: "ขยายรูปภาพ", en: "Enlarge image" })}
              className="relative block h-56 w-full cursor-zoom-in sm:h-80 lg:h-120"
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={index === 0}
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </button>
          </SwiperSlide>
        ))}
      </Swiper>
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => swiper.current?.slidePrev()}
            aria-label={t({ th: "รูปก่อนหน้า", en: "Previous image" })}
            className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-md sm:left-5 sm:size-12"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => swiper.current?.slideNext()}
            aria-label={t({ th: "รูปถัดไป", en: "Next image" })}
            className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-md sm:right-5 sm:size-12"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
          <div
            className="absolute bottom-3 right-3 z-10 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold text-white"
            aria-live="polite"
          >
            {current + 1} / {images.length}
          </div>
        </>
      )}
      <dialog
        ref={dialog}
        onClose={() => setExpanded(false)}
        aria-label={t({ th: "ดูรูปภาพขนาดใหญ่", en: "Enlarged image" })}
        className="m-auto h-dvh max-h-none w-screen max-w-none bg-transparent p-0 backdrop:bg-slate-950/90"
      >
        <div
          className="relative flex h-full w-full items-center justify-center p-12 sm:p-16"
          onClick={() => setExpanded(false)}
        >
          <Image
            src={images[current].src}
            alt={images[current].alt}
            fill
            unoptimized
            sizes="100vw"
            className="object-contain p-12 sm:p-16"
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label={t({ th: "ปิดรูปภาพ", en: "Close image" })}
            className="absolute right-4 top-4 z-10 grid size-11 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  const next = (current - 1 + images.length) % images.length;
                  setCurrent(next);
                  swiper.current?.slideToLoop(next);
                }}
                aria-label={t({ th: "รูปก่อนหน้า", en: "Previous image" })}
                className="absolute left-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white"
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  const next = (current + 1) % images.length;
                  setCurrent(next);
                  swiper.current?.slideToLoop(next);
                }}
                aria-label={t({ th: "รูปถัดไป", en: "Next image" })}
                className="absolute right-3 top-1/2 z-10 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white"
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
              <span className="absolute bottom-5 left-1/2 -translate-x-1/2 text-sm text-white">
                {current + 1} / {images.length}
              </span>
            </>
          )}
        </div>
      </dialog>
    </div>
  );
}
