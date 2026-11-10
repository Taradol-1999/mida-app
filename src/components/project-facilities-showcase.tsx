"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import { useTranslation } from "@/components/language-provider";

type FacilityImage = {
  id: string;
  url: string;
  alt?: string;
};

export type FacilityCategory = {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  images: FacilityImage[];
};

type Props = {
  facilities: FacilityCategory[];
  title?: string;
  description?: string;
};

export function ProjectFacilitiesShowcase({
  facilities,
  title = "สิ่งอำนวยความสะดวก",
  description = "เพราะความสุขมีได้ไม่รู้จบ บนพื้นที่ส่วนตัวสำหรับทำกิจกรรมที่ชื่นชอบ ทั้งฟิตเนส สระว่ายน้ำ และสวนส่วนกลาง",
}: Props) {
  const { t } = useTranslation();
  const panoramaId = useId();
  const swiperRef = useRef<SwiperType | null>(null);

  const [activeCategory, setActiveCategory] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const category = facilities[activeCategory] ?? facilities[0];

  const images = category?.images ?? [];
  const total = images.length;

  const canLoop = total >= 6;
  // Centered slides need room on both sides when looping on desktop.
  const slides = canLoop && total < 9 ? [...images, ...images] : images;

  const selectCategory = (index: number) => {
    if (index === activeCategory) return;

    setActiveCategory(index);
    setActiveImage(0);
    swiperRef.current = null;
  };

  const nextCategory = () => {
    if (!facilities.length) return;

    selectCategory((activeCategory + 1) % facilities.length);
  };

  const move = (direction: -1 | 1) => {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed || total <= 1) {
      return;
    }

    const nextIndex = (swiper.realIndex + direction + slides.length) % slides.length;

    if (canLoop) {
      swiper.slideToLoop(nextIndex);
    } else {
      swiper.slideTo(nextIndex);
    }
  };

  if (!facilities.length) return null;

  return (
    <section id="facilities" className="relative overflow-hidden bg-facility py-14 text-white sm:py-16 lg:py-20">
      {/* HEADER */}
      <div className="project-container relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* TITLE */}
          <h2 className="wrap-break-word text-2xl font-black leading-snug tracking-tight sm:text-3xl xl:text-5xl">
            {title}
          </h2>

          {/* CATEGORY FILTER */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {facilities.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => selectCategory(index)}
                  aria-pressed={activeCategory === index}
                  className={`
                    min-h-11 text-xs font-bold uppercase
                    tracking-wide sm:tracking-[0.12em]
                    transition-all duration-300
                    ${activeCategory === index ? "text-white opacity-100" : "text-white/60 hover:text-white"}
                  `}
                >
                  {t({ th: item.name, en: item.nameEn ?? "" })}
                </button>

                {index < facilities.length - 1 && <span className="size-1 rounded-full bg-white/80" />}
              </div>
            ))}

            {/* NEXT CATEGORY */}
            {facilities.length > 1 && (
              <button
                type="button"
                onClick={nextCategory}
                aria-label="Next category"
                className="ml-1 grid size-8 place-items-center rounded-full border border-white/40 transition-all duration-300 hover:bg-white hover:text-facility-ink"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANORAMA GALLERY */}
      <div className="mt-6 lg:mt-12">
        {total > 0 ? (
          <>
            <svg className="pointer-events-none absolute size-0" aria-hidden="true">
              <clipPath id={panoramaId} clipPathUnits="objectBoundingBox">
                <path d="M 0,0 Q .5,.32 1,0 L 1,1 Q .5,.68 0,1 Z" />
              </clipPath>
            </svg>
            <div style={{ clipPath: `url("#${panoramaId}")` }}>
              <Swiper
                key={category.id}
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  setActiveImage(swiper.realIndex % total);
                }}
                onSlideChange={(swiper) => {
                  setActiveImage(swiper.realIndex % total);
                }}
                slidesPerView="auto"
                centeredSlides
                loop={canLoop}
                speed={750}
                grabCursor={total > 1}
                allowTouchMove={total > 1}
                spaceBetween={10}
                breakpoints={{
                  640: {
                    spaceBetween: 12,
                  },
                  1024: {
                    spaceBetween: 18,
                  },
                }}
                className="facility-panorama"
              >
                {slides.map((item, index) => (
                  <SwiperSlide key={`${item.id}-${index}`} className="facility-panorama-slide">
                    <div className="facility-panorama-image">
                      <Image
                        src={item.url}
                        alt={item.alt || category.name}
                        fill
                        unoptimized={item.url.includes("?")}
                        sizes="(min-width: 1024px) 29vw, (min-width: 640px) 42vw, 70vw"
                        className="object-cover"
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </>
        ) : (
          <div className="grid min-h-48 place-items-center text-white/80">ไม่มีรูปภาพในหมวดหมู่นี้</div>
        )}
      </div>

      {/* DESCRIPTION */}
      <div className="project-container relative z-10 mt-6 sm:mt-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm leading-7 text-white/90 sm:text-base">
            {t({ th: category.description || description, en: category.descriptionEn ?? "" })}
          </p>

          {/* IMAGE NAVIGATION */}
          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {/* PREVIOUS */}
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous image"
                className="grid size-8 place-items-center rounded-full border border-white/50 transition-all duration-300 hover:bg-white hover:text-facility-ink"
              >
                <i className="fa-solid fa-chevron-left text-xs" />
              </button>

              {/* COUNTER */}
              <span className="min-w-16 text-center text-xs tabular-nums">
                {String(activeImage + 1).padStart(2, "0")}
                {" / "}
                {String(total).padStart(2, "0")}
              </span>

              {/* NEXT */}
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Next image"
                className="grid size-8 place-items-center rounded-full border border-white/50 transition-all duration-300 hover:bg-white hover:text-facility-ink"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
