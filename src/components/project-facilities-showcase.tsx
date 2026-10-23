"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

type FacilityImage = {
  id: string;
  url: string;
  alt?: string;
};

export type FacilityCategory = {
  id: string;
  name: string;
  description?: string;
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
  const swiperRef = useRef<SwiperType | null>(null);

  const [activeCategory, setActiveCategory] = useState(0);
  const [activeImage, setActiveImage] = useState(0);

  const category = facilities[activeCategory] ?? facilities[0];

  const images = category?.images ?? [];
  const total = images.length;

  // เปิด Loop เมื่อมีรูปเพียงพอ
  const canLoop = total >= 6;

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

    const nextIndex = (swiper.realIndex + direction + total) % total;

    if (canLoop) {
      swiper.slideToLoop(nextIndex);
    } else {
      swiper.slideTo(nextIndex);
    }
  };

  if (!facilities.length) return null;

  return (
    <section className="relative overflow-hidden bg-[#4CA1D7] py-14 text-white sm:py-16 lg:py-20">
      {/* HEADER */}
      <div className="project-container relative z-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* TITLE */}
          <h2 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>

          {/* CATEGORY FILTER */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {facilities.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => selectCategory(index)}
                  aria-pressed={activeCategory === index}
                  className={`
                    text-[10px] font-bold uppercase
                    tracking-[0.12em]
                    transition-all duration-300
                    ${activeCategory === index ? "text-white opacity-100" : "text-white/60 hover:text-white"}
                  `}
                >
                  {item.name}
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
                className="ml-1 grid size-8 place-items-center rounded-full border border-white/40 transition-all duration-300 hover:bg-white hover:text-[#2586C5]"
              >
                <i className="fa-solid fa-chevron-right text-xs" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PANORAMA GALLERY */}
      <div className="relative mt-8 w-full overflow-hidden lg:mt-10">
        {total > 0 ? (
          <Swiper
            key={category.id}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
              setActiveImage(swiper.realIndex);
            }}
            onSlideChange={(swiper) => {
              setActiveImage(swiper.realIndex);
            }}
            slidesPerView="auto"
            centeredSlides
            loop={canLoop}
            speed={750}
            grabCursor={total > 1}
            allowTouchMove={total > 1}
            watchSlidesProgress
            spaceBetween={10}
            breakpoints={{
              640: {
                spaceBetween: 12,
              },
              1024: {
                spaceBetween: 14,
              },
            }}
            className="overflow-visible! py-8!"
          >
            {images.map((item) => (
              <SwiperSlide key={item.id} className="w-[68vw]! sm:w-[38vw]! lg:w-[27vw]! xl:w-[24vw]!">
                {({ isActive, isPrev, isNext }) => {
                  const transformClass = isActive
                    ? "z-20 scale-100 opacity-100"
                    : isPrev
                      ? "z-10 [transform:perspective(1200px)_rotateY(5deg)_scale(0.98)] opacity-95"
                      : isNext
                        ? "z-10 [transform:perspective(1200px)_rotateY(-5deg)_scale(0.98)] opacity-95"
                        : "z-0 scale-[0.96] opacity-85";

                  return (
                    <div className="flex h-75 items-center justify-center sm:h-85 lg:h-97.5">
                      {/* IMAGE CARD */}
                      <div
                        className={`
                          relative w-full overflow-hidden
                          bg-white/10
                          transition-[transform,opacity,height]
                          duration-700 ease-in-out
                          ${isActive ? "h-full" : "h-[94%]"}
                          ${transformClass}
                        `}
                      >
                        <Image
                          src={item.url}
                          alt={item.alt || category.name}
                          fill
                          unoptimized={item.url.includes("?")}
                          sizes="(min-width: 1280px) 24vw, (min-width: 1024px) 27vw, (min-width: 640px) 38vw, 68vw"
                          className="object-cover"
                        />

                        {/* SIDE IMAGE OVERLAY */}
                        <div
                          className={`
                            pointer-events-none
                            absolute inset-0
                            bg-[#4CA1D7]
                            transition-opacity duration-700
                            ${isActive ? "opacity-0" : "opacity-15"}
                          `}
                        />
                      </div>
                    </div>
                  );
                }}
              </SwiperSlide>
            ))}
          </Swiper>
        ) : (
          <div className="grid h-85 place-items-center text-white/80">ไม่มีรูปภาพในหมวดหมู่นี้</div>
        )}

        {/* TOP PANORAMA CURVE */}
        <div
          className="
            pointer-events-none absolute
            -top-28 left-1/2 z-30
            h-56 w-[155%]
            -translate-x-1/2
            rounded-[0_0_100%_100%]
            bg-[#4CA1D7]
            sm:-top-30 sm:h-60
            lg:-top-32 lg:h-64
          "
        />

        {/* BOTTOM PANORAMA CURVE */}
        <div
          className="
            pointer-events-none absolute
            -bottom-18 left-1/2 z-30
            h-32 w-[165%]
            -translate-x-1/2
            rounded-[100%_100%_0_0]
            bg-[#4CA1D7]
            sm:-bottom-20 sm:h-36
            lg:-bottom-22 lg:h-40
          "
        />
      </div>

      {/* DESCRIPTION */}
      <div className="project-container relative z-10 mt-8 sm:mt-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm leading-7 text-white/90 sm:text-base">
            <span className="font-bold">“Enjoy your Space”</span> {category.description || description}
          </p>

          {/* IMAGE NAVIGATION */}
          {total > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3">
              {/* PREVIOUS */}
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Previous image"
                className="grid size-8 place-items-center rounded-full border border-white/50 transition-all duration-300 hover:bg-white hover:text-[#2586C5]"
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
                className="grid size-8 place-items-center rounded-full border border-white/50 transition-all duration-300 hover:bg-white hover:text-[#2586C5]"
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
