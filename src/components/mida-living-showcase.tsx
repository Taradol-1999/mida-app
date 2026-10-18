"use client";

import Image from "next/image";
import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow } from "swiper/modules";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";
import "swiper/css/effect-coverflow";
import { useTranslation } from "@/components/language-provider";
import agencyLogo from "@/assets/logos/png/03-mida-agency-development.png";
import matrixLogo from "@/assets/logos/png/05-the-matrix-ratchamankha.png";
import propertyLogo from "@/assets/logos/png/01-mida-property.png";
import matrixByMidaLogo from "@/assets/logos/png/06-the-matrix-by-mida.png";
import constructionLogo from "@/assets/logos/png/04-interexpert-construction.png";

export type MidaLivingItem = {
  id: string;
  nameTh: string;
  nameEn?: string | null;
  descriptionTh?: string | null;
  descriptionEn?: string | null;
  websiteUrl?: string | null;
  imageUrl?: string | null;
};

const brands = [
  { id: "agency", nameTh: "MIDA AGENCY", logo: agencyLogo, color: "from-[#b9d7e9] via-[#dfeaf2] to-[#789eb7]" },
  { id: "matrix", nameTh: "THE MATRIX", logo: matrixLogo, color: "from-[#c8d3d4] via-[#f0e9df] to-[#9babb2]" },
  { id: "property", nameTh: "MIDA PROPERTY", logo: propertyLogo, color: "from-[#dbe8ed] via-[#fffaf3] to-[#c4d5dc]" },
  {
    id: "matrix-mida",
    nameTh: "THE MATRIX BY MIDA",
    logo: matrixByMidaLogo,
    color: "from-[#b9d9d2] via-[#e8f1ec] to-[#739d9a]",
  },
  {
    id: "construction",
    nameTh: "INTEREXPERT",
    logo: constructionLogo,
    color: "from-[#c3d3e4] via-[#e7edf3] to-[#7892ad]",
  },
];

export function MidaLivingShowcase({ items = [] }: { items?: MidaLivingItem[] }) {
  const { t } = useTranslation();
  const swiperRef = useRef<SwiperInstance | null>(null);
  const source = items.length ? items : brands;
  const canLoop = source.length >= 5;
  // Five or more items use neighboring copies for a smooth loop. Smaller CMS sets display once without duplicates.
  const carouselItems = canLoop ? [...source, ...source, ...source] : source;

  function updateVisibleSlides(swiper: SwiperInstance) {
    const count = swiper.params.slidesPerView;
    const radius = typeof count === "number" ? Math.floor(count / 2) : 2;
    swiper.slides.forEach((slide) => {
      // Fade an arriving card in before it reaches the visible five-card set.
      const distance = Math.abs(slide.progress ?? 0);
      slide.style.opacity = String(Math.max(0, Math.min(1, radius + 0.5 - distance)));
      slide.style.pointerEvents = distance <= radius + 0.5 ? "auto" : "none";
    });
  }

  return (
    <section id="living" className="relative overflow-hidden bg-[#eaf4fb] pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="container-page text-center">
        <p className="text-xs font-extrabold tracking-[0.22em] text-[#168cc5]">THE MIDA FAMILY</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-primary sm:text-4xl">
          {t({ th: "เริ่มที่เรา เริ่มที่ไมด้า", en: "It starts with us. It starts with MIDA." })}
        </h2>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          {t({ th: "หลากหลายธุรกิจเพื่อทุกจังหวะของการใช้ชีวิต", en: "Businesses for every moment of life." })}
        </p>
      </div>

      <div className="relative mx-auto mt-5 w-full px-2 sm:px-8">
        <Swiper
          modules={[EffectCoverflow]}
          effect="coverflow"
          centeredSlides
          loop={canLoop}
          loopAdditionalSlides={canLoop ? source.length : 0}
          watchSlidesProgress
          grabCursor
          initialSlide={canLoop ? source.length + Math.floor(source.length / 2) : Math.floor(source.length / 2)}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: Math.min(3, source.length) },
            1024: { slidesPerView: Math.min(5, source.length) },
          }}
          speed={700}
          coverflowEffect={{ rotate: 0, stretch: -28, depth: 180, modifier: 1.35, slideShadows: false }}
          className="overflow-hidden! py-8! sm:py-12!"
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
              <div
                className={`relative size-full overflow-hidden rounded-[inherit] ${"color" in brand ? `bg-linear-to-br ${brand.color}` : "bg-slate-200"} text-left shadow-[0_18px_35px_rgba(0,45,98,.2)] ring-1 ring-white/70`}
              >
                {"imageUrl" in brand && brand.imageUrl ? (
                  <Image
                    src={brand.imageUrl}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 20vw, (min-width: 640px) 34vw, 82vw"
                  />
                ) : "logo" in brand ? (
                  <span className="relative flex size-full items-center justify-center p-5 text-center">
                    <Image
                      src={brand.logo}
                      alt={name}
                      className="size-full object-contain drop-shadow-xl"
                      sizes="(min-width: 640px) 304px, 78vw"
                    />
                  </span>
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-slate-400">
                    <i className="fa-regular fa-image text-5xl" />
                  </span>
                )}
                <span className="absolute inset-0 bg-linear-to-t from-black/80 via-black/5 to-white/10" />
                <span className="absolute inset-x-5 bottom-5 z-10 text-white drop-shadow-md">
                  <strong className="block text-sm font-black tracking-wide sm:text-base">{name}</strong>
                  {description && (
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-white/85 sm:text-sm">
                      {description}
                    </span>
                  )}
                  {"websiteUrl" in brand && brand.websiteUrl && (
                    <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-brand-accent">
                      เยี่ยมชมเว็บไซต์ <i className="fa-solid fa-arrow-up-right-from-square" />
                    </span>
                  )}
                </span>
              </div>
            );
            return (
              <SwiperSlide
                key={`${brand.id}-${index}`}
                className="h-100! overflow-hidden rounded-2xl sm:h-140! sm:rounded-3xl"
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
        {/* <button
          type="button"
          aria-label={t({ th: "ก่อนหน้า", en: "Previous" })}
          onClick={() => swiperRef.current?.slidePrev()}
          className="absolute left-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white text-brand-primary shadow-lg transition hover:bg-brand-primary hover:text-white sm:left-[calc(50%-12rem)]"
        >
          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t({ th: "ถัดไป", en: "Next" })}
          onClick={() => swiperRef.current?.slideNext()}
          className="absolute right-3 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-brand-primary text-white shadow-lg transition hover:bg-white hover:text-brand-primary sm:right-[calc(50%-12rem)]"
        >
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
        </button> */}
      </div>
    </section>
  );
}
