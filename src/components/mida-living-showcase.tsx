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

const brands = [
  { name: "MIDA AGENCY", logo: agencyLogo, color: "from-[#b9d7e9] via-[#dfeaf2] to-[#789eb7]" },
  { name: "THE MATRIX", logo: matrixLogo, color: "from-[#c8d3d4] via-[#f0e9df] to-[#9babb2]" },
  { name: "MIDA PROPERTY", logo: propertyLogo, color: "from-[#dbe8ed] via-[#fffaf3] to-[#c4d5dc]" },
  { name: "THE MATRIX BY MIDA", logo: matrixByMidaLogo, color: "from-[#b9d9d2] via-[#e8f1ec] to-[#739d9a]" },
  { name: "INTEREXPERT", logo: constructionLogo, color: "from-[#c3d3e4] via-[#e7edf3] to-[#7892ad]" },
];

// Swiper needs neighboring copies to keep a five-card coverflow looping smoothly.
const carouselBrands = [...brands, ...brands, ...brands];

export function MidaLivingShowcase() {
  const { t } = useTranslation();
  const swiperRef = useRef<SwiperInstance | null>(null);

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
          loop
          loopAdditionalSlides={brands.length}
          watchSlidesProgress
          grabCursor
          initialSlide={brands.length + 2}
          slidesPerView={1}
          breakpoints={{
            640: { slidesPerView: 3 },
            1024: { slidesPerView: 5 },
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
          {carouselBrands.map((brand, index) => (
            <SwiperSlide
              key={`${brand.name}-${index}`}
              className="h-100! overflow-hidden rounded-2xl sm:h-140! sm:rounded-3xl"
            >
              <div
                className={`relative size-full overflow-hidden rounded-[inherit] bg-linear-to-br ${brand.color} text-left shadow-[0_18px_35px_rgba(0,45,98,.2)] ring-1 ring-white/70`}
              >
                <span className="absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-white/10" />
                <span className="absolute -right-14 -top-14 size-44 rounded-full border-24 border-white/25" />
                <span className="relative flex size-full items-center justify-center p-5 text-center">
                  <Image
                    src={brand.logo}
                    alt={brand.name}
                    className="size-full object-contain drop-shadow-xl"
                    sizes="(min-width: 640px) 304px, 78vw"
                  />
                  <span className="absolute inset-x-4 bottom-5 text-sm font-black tracking-wide text-white drop-shadow-md sm:text-base">
                    {brand.name}
                  </span>
                </span>
              </div>
            </SwiperSlide>
          ))}
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
