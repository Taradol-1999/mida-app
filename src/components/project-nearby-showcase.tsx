"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";

import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";

import { useTranslation } from "@/components/language-provider";
import type { ProjectGalleryItem } from "@/components/project-gallery";

type NearbyPlace = {
  th: string;
  en?: string;
  description?: string;
  descriptionEn?: string;
};

type Props = {
  places: NearbyPlace[];
  media: ProjectGalleryItem[];
  location: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
};

export function ProjectNearbyShowcase({ places, media, location, title, titleEn, description, descriptionEn }: Props) {
  const { t } = useTranslation();

  const swiperRef = useRef<SwiperType | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!places.length && !title) return null;

  const total = places.length;
  const canLoop = total > 3;

  const move = (direction: -1 | 1) => {
    const swiper = swiperRef.current;

    if (!swiper || swiper.destroyed) return;

    if (direction === 1) {
      if (!canLoop && swiper.isEnd) {
        swiper.slideTo(0);
      } else {
        swiper.slideNext();
      }
    } else {
      if (!canLoop && swiper.isBeginning) {
        swiper.slideTo(total - 1);
      } else {
        swiper.slidePrev();
      }
    }
  };

  return (
    <section className="overflow-hidden bg-[#eaf4fb] py-14 sm:py-16 lg:py-24">
      <div className="project-container">
        <div className="grid min-w-0 grid-cols-1 items-center gap-10 lg:grid-cols-[310px_minmax(0,1fr)] lg:gap-12 xl:grid-cols-[600px_minmax(0,1fr)] xl:gap-14">
          {/* LEFT CONTENT */}
          <div className="relative z-10">
            <h2 className="whitespace-pre-line text-3xl font-black leading-[1.16] tracking-tight text-brand-primary sm:text-4xl">
              {t({
                th: title ?? `ตอบทุกโจทย์\nความต้องการบ้านใหม่ทุกทำเล\n${location || "ในทำเลที่ใช่"}`,
                en: titleEn || title || "Everything you need, close to home",
              })}
            </h2>

            <p className="mt-6 text-sm leading-7 text-[#2470a4] sm:text-base">
              {t({
                th:
                  description ??
                  "เพราะชีวิตที่ดีเริ่มจากทำเลที่เชื่อมต่อทุกความสะดวก ทั้งการเดินทาง แหล่งไลฟ์สไตล์ และบริการสำคัญรอบโครงการ",
                en:
                  descriptionEn ||
                  description ||
                  "A connected location puts everyday conveniences, lifestyle destinations, and essential services within easy reach.",
              })}
            </p>
          </div>
          {/* RIGHT SWIPER */}
          <div className="relative min-w-0" hidden={!total}>
            <div className="relative w-full overflow-hidden">
              <Swiper
                onSwiper={(swiper) => {
                  swiperRef.current = swiper;
                  setActiveIndex(swiper.realIndex);
                }}
                onSlideChange={(swiper) => {
                  setActiveIndex(swiper.realIndex);
                }}
                slidesPerView="auto"
                spaceBetween={12}
                speed={650}
                loop={canLoop}
                grabCursor={total > 1}
                allowTouchMove={total > 1}
                watchSlidesProgress
                breakpoints={{
                  640: {
                    spaceBetween: 12,
                  },
                  1024: {
                    spaceBetween: 12,
                  },
                }}
                className="w-full! overflow-hidden!"
              >
                {places.map((place, index) => {
                  const item = media.length ? media[index % media.length] : null;

                  const name = t({
                    th: place.th,
                    en: place.en ?? place.th,
                  });

                  return (
                    <SwiperSlide key={`${place.th}-${index}`} className="w-[72vw]! sm:w-55! lg:w-52.5! xl:w-56.25!">
                      {({ isActive }) => (
                        <div className="flex h-82.5 items-start sm:h-87.5">
                          <article
                            className={`
                              group relative w-full overflow-hidden
                              rounded-[20px] bg-brand-primary
                              shadow-[0_12px_24px_rgba(0,45,98,.13)]
                              transition-[height,margin,opacity]
                              duration-500 ease-in-out
                              ${isActive ? "mt-0 h-77.5 opacity-100 sm:h-82.5" : "mt-4.5 h-68.75 opacity-100 sm:h-73"}
                            `}
                          >
                            {/* MEDIA */}
                            {item ? (
                              item.type === "video" ? (
                                <video
                                  src={item.src}
                                  muted
                                  playsInline
                                  preload="metadata"
                                  className="size-full object-cover"
                                />
                              ) : (
                                <Image
                                  src={item.src}
                                  alt={name}
                                  fill
                                  unoptimized={item.src.includes("?")}
                                  sizes="(min-width: 1280px) 225px, (min-width: 640px) 220px, 72vw"
                                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              )
                            ) : (
                              <div className="grid size-full place-items-center bg-linear-to-br from-[#1aa7dc] to-brand-primary text-white/80">
                                <i className="fa-solid fa-location-dot text-5xl" aria-hidden="true" />
                              </div>
                            )}

                            {/* GRADIENT */}
                            <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-brand-overlay/90 via-brand-overlay/5 to-transparent" />

                            {/* PLACE NAME */}
                            <div className="absolute inset-x-4 bottom-4 text-white">
                              <h3 className="line-clamp-2 text-xs font-extrabold leading-snug drop-shadow sm:text-sm">
                                {name}
                              </h3>
                              {place.description && (
                                <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-white/85">
                                  {t({ th: place.description, en: place.descriptionEn ?? "" })}
                                </p>
                              )}
                            </div>
                          </article>
                        </div>
                      )}
                    </SwiperSlide>
                  );
                })}
              </Swiper>
            </div>

            {/* NAVIGATION */}
            {total > 1 && (
              <div className="mt-5 flex items-center justify-center gap-4 sm:mt-6">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => move(-1)}
                    aria-label={t({
                      th: "สถานที่ก่อนหน้า",
                      en: "Previous place",
                    })}
                    className="grid size-8 place-items-center rounded-full border border-[#075a9b] bg-transparent text-[#075a9b] transition-all duration-300 hover:bg-[#075a9b] hover:text-white sm:size-9"
                  >
                    <i className="fa-solid fa-chevron-left text-[0.65rem]" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    onClick={() => move(1)}
                    aria-label={t({
                      th: "สถานที่ถัดไป",
                      en: "Next place",
                    })}
                    className="grid size-8 place-items-center rounded-full border border-[#075a9b] bg-transparent text-[#075a9b] transition-all duration-300 hover:bg-[#075a9b] hover:text-white sm:size-9"
                  >
                    <i className="fa-solid fa-chevron-right text-[0.65rem]" aria-hidden="true" />
                  </button>
                </div>

                <span className="h-px min-w-8 max-w-62.5 flex-1 bg-[#1aa7dc]/60" />

                <span className="whitespace-nowrap text-3xl font-light tabular-nums text-[#075a9b] sm:text-4xl">
                  {String(activeIndex + 1).padStart(2, "0")}
                  <small className="ml-0.5 text-[0.38em]">/{String(total).padStart(2, "0")}</small>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
