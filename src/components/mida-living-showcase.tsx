"use client";

import Image from "next/image";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Autoplay } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { useTranslation } from "@/components/language-provider";

export type MidaLivingItem = {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  descriptionTh?: string | null;
  descriptionEn?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
};

export function MidaLivingShowcase({ items = [] }: { items?: MidaLivingItem[] }) {
  const { t } = useTranslation();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const source = items;
  const canLoop = source.length >= 5;
  // Five or more items use neighboring copies for a smooth loop. Smaller CMS sets display once without duplicates.
  const carouselItems = canLoop ? [...source, ...source, ...source] : source;

  function updateVisibleSlides(swiper: SwiperInstance) {
    const count = swiper.params.slidesPerView;
    const radius = typeof count === "number" ? Math.floor(count / 2) : 2;
    swiper.slides.forEach((slide) => {
      // Fade an arriving card in before it reaches the visible five-card set.
      const distance = Math.abs(slide.progress ?? 0);
      slide.style.opacity = String(Math.max(0, Math.min(1, radius + 1 - distance)));
      const edgeFade = radius > 0 ? Math.max(0, Math.min(1, distance - (radius - 1))) : 0;
      const fadeSize = Math.round(edgeFade * 25);
      const direction = (slide.progress ?? 0) > 0 ? "right" : "left";
      const mask = fadeSize > 0 ? `linear-gradient(to ${direction}, transparent, black ${fadeSize}%)` : "none";
      slide.style.maskImage = mask;
      slide.style.webkitMaskImage = mask;
      slide.style.pointerEvents = distance <= radius + 0.5 ? "auto" : "none";
    });
  }

  if (!source.length) return null;

  return (
    <section id="living" className="relative overflow-hidden bg-[#eaf4fb] pb-12 pt-10 sm:pb-20 sm:pt-16 lg:pb-28">
      <div className="container-page text-center">
        <p className="text-xs font-extrabold tracking-[0.22em] text-[#168cc5]">THE MIDA FAMILY</p>
        <h2 className="mt-3 text-2xl font-black leading-snug tracking-tight text-brand-primary sm:text-4xl">
          {t({ th: "เริ่มที่เรา เริ่มที่ไมด้า", en: "It starts with us. It starts with MIDA." })}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">
          {t({ th: "หลากหลายธุรกิจเพื่อทุกจังหวะของการใช้ชีวิต", en: "Businesses for every moment of life." })}
        </p>
      </div>
      <div className="relative mx-auto mt-1 sm:mt-5 w-full px-3 sm:max-w-none">
        <Swiper
          modules={[EffectCoverflow, Autoplay]}
          effect="coverflow"
          centeredSlides
          loop={canLoop}
          loopAdditionalSlides={canLoop ? source.length : 0}
          watchSlidesProgress
          grabCursor
          initialSlide={canLoop ? source.length + Math.floor(source.length / 2) : Math.floor(source.length / 2)}
          slidesPerView={1}
          autoplay={
            canLoop
              ? {
                  delay: 4500, // ระยะเวลาหยุดค้างในแต่ละสไลด์ (มิลลิวินาที)
                  disableOnInteraction: false, // เล่น auto loop ต่อแม้ว่าจะมีการคลิกหรือลากสไลด์
                  pauseOnMouseEnter: true, // (Option) เลื่อนเมาส์มาชี้แล้วหยุดชั่วคราว
                }
              : false
          }
          breakpoints={{
            // 0: {
            //   slidesPerView: Math.min(3, source.length),
            //   coverflowEffect: { rotate: 0, stretch: 20, depth: 260, modifier: 1.35, slideShadows: false },
            // },
            0: {
              slidesPerView: Math.min(3, source.length),
              coverflowEffect: { rotate: 0, stretch: -10, depth: 260, modifier: 0.75, slideShadows: false },
            },
            1024: {
              slidesPerView: Math.min(3, source.length),
              coverflowEffect: { rotate: 0, stretch: -15, depth: 180, modifier: 1.35, slideShadows: false },
            },
            1280: { slidesPerView: Math.min(5, source.length) },
          }}
          speed={700}
          coverflowEffect={{ rotate: 0, stretch: -28, depth: 180, modifier: 1.35, slideShadows: false }}
          className="overflow-hidden! py-5! sm:py-10! lg:py-12!"
          aria-label={t({ th: "เริ่มที่เรา เริ่มที่ไมด้า", en: "It starts with us. It starts with MIDA." })}
          onSwiper={(swiper) => {
            swiperRef.current = swiper;
            updateVisibleSlides(swiper);
          }}
          onBreakpoint={updateVisibleSlides}
          onProgress={updateVisibleSlides}
        >
          {carouselItems.map((brand, index) => {
            const name = t({ th: brand.nameTh, en: "nameEn" in brand && brand.nameEn ? brand.nameEn : brand.nameTh });
            const description =
              "descriptionTh" in brand
                ? t({ th: brand.descriptionTh ?? "", en: brand.descriptionEn ?? brand.descriptionTh ?? "" })
                : "";
            const card = (
              <div className="relative size-full overflow-hidden rounded-[inherit] bg-slate-200 text-left shadow-[0_18px_35px_rgba(0,45,98,.2)] ring-1 ring-white/70">
                {"imageUrl" in brand && brand.imageUrl ? (
                  <Image
                    src={brand.imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 94vw, 82vw"
                  />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-slate-400">
                    <i className="fa-regular fa-image text-5xl" />
                  </span>
                )}
                <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/5 to-white/10" />
                <span className="absolute inset-x-2 bottom-3 z-10 text-white drop-shadow-md sm:inset-x-5 sm:bottom-5">
                  <strong className="block break-words text-xs font-black leading-snug sm:text-base">{name}</strong>
                  {description && (
                    <span className="mt-1 line-clamp-2 block break-words text-[11px] leading-4 text-white/85 sm:text-sm sm:leading-5">
                      {description}
                    </span>
                  )}
                  {"websiteUrl" in brand && brand.websiteUrl && (
                    <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold leading-4 text-brand-accent sm:mt-3 sm:gap-2 sm:text-xs">
                      เยี่ยมชมเว็บไซต์ <i className="fa-solid fa-arrow-up-right-from-square" />
                    </span>
                  )}
                </span>
              </div>
            );

            return (
              <SwiperSlide
                key={`${brand.id}-${index}`}
                // className="h-[min(50vw,360px)]! overflow-hidden rounded-xl sm:h-105! sm:rounded-3xl lg:h-140!"
                className="h-[min(52vw,340px)]! overflow-hidden rounded-xl sm:h-105! sm:rounded-3xl lg:h-140!"
              >
                {"websiteUrl" in brand && brand.websiteUrl ? (
                  <a
                    href={brand.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block size-full"
                    aria-label={`${name} — เปิดเว็บไซต์`}
                  >
                    {card}
                  </a>
                ) : (
                  card
                )}
              </SwiperSlide>
            );
          })}
        </Swiper>
        {/* {source.length > 1 && (
          <>
            <button
              type="button"
              aria-label={t({ th: "ก่อนหน้า", en: "Previous" })}
              onClick={() => swiperRef.current?.slidePrev()}
              className="absolute left-3 top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-white text-xs text-brand-primary shadow-lg transition hover:bg-brand-primary hover:text-white sm:left-[calc(50%-12rem)] sm:size-11 sm:text-sm"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={t({ th: "ถัดไป", en: "Next" })}
              onClick={() => swiperRef.current?.slideNext()}
              className="absolute right-3 top-1/2 z-20 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-brand-primary text-xs text-white shadow-lg transition hover:bg-white hover:text-brand-primary sm:right-[calc(50%-12rem)] sm:size-11 sm:text-sm"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </>
        )} */}
      </div>
    </section>
  );
}
