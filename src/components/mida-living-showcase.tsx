"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";
import agencyLogo from "@/assets/logos/png/03-mida-agency-development.png";
import matrixLogo from "@/assets/logos/png/05-the-matrix-ratchamankha.png";
import propertyLogo from "@/assets/logos/png/01-mida-property.png";
import matrixByMidaLogo from "@/assets/logos/png/06-the-matrix-by-mida.png";
import constructionLogo from "@/assets/logos/png/04-interexpert-construction.png";

const brands = [
  { name: "MIDA AGENCY", logo: agencyLogo, color: "from-[#dbe9f2] to-[#9fc4d7]" },
  { name: "THE MATRIX", logo: matrixLogo, color: "from-[#e9e4df] to-[#b9c2c5]" },
  { name: "MIDA PROPERTY", logo: propertyLogo, color: "from-[#f5ece0] to-[#c7dce8]" },
  { name: "THE MATRIX BY MIDA", logo: matrixByMidaLogo, color: "from-[#d8e9e5] to-[#8cb7b4]" },
  { name: "INTEREXPERT", logo: constructionLogo, color: "from-[#e0e8f1] to-[#a7bfd5]" },
];

export function MidaLivingShowcase() {
  const { t } = useTranslation();
  const [active, setActive] = useState(2);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    const card = track?.children[2] as HTMLElement | undefined;
    if (!track || !card) return;
    const cardLeft = card.getBoundingClientRect().left - track.getBoundingClientRect().left + track.scrollLeft;
    track.scrollLeft = cardLeft - (track.clientWidth - card.clientWidth) / 2;
  }, []);

  function select(index: number) {
    const next = (index + brands.length) % brands.length;
    setActive(next);
    const card = trackRef.current?.children[next] as HTMLElement | undefined;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  return (
    <section id="living" className="overflow-hidden pb-20 pt-10 sm:pb-28 sm:pt-16">
      <div className="container-page text-center">
        <p className="text-xs font-extrabold tracking-[0.22em] text-[#168cc5]">THE MIDA FAMILY</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-brand-primary sm:text-4xl">
          {t({ th: "เริ่มที่เรา เริ่มที่ไมด้า", en: "It starts with us. It starts with MIDA." })}
        </h2>
        <p className="mt-3 text-sm text-slate-500 sm:text-base">
          {t({ th: "หลากหลายธุรกิจเพื่อทุกจังหวะของการใช้ชีวิต", en: "Businesses for every moment of life." })}
        </p>
      </div>
      <div className="relative mx-auto mt-10 max-w-7xl px-4 sm:mt-14 sm:px-8">
        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory items-center gap-3 overflow-x-auto px-[12vw] py-7 scrollbar-none sm:gap-4 lg:px-4 [&::-webkit-scrollbar]:hidden"
        >
          {brands.map((brand, index) => (
            <button
              key={brand.name}
              type="button"
              onClick={() => select(index)}
              aria-label={brand.name}
              aria-pressed={active === index}
              className={`group relative h-72 min-w-[68vw] snap-center overflow-hidden rounded-2xl bg-gradient-to-br ${brand.color} p-5 text-left shadow-[0_15px_35px_rgba(0,45,98,.12)] transition-all duration-300 sm:min-w-[38vw] lg:h-80 lg:min-w-[calc(20%-0.8rem)] ${active === index ? "z-10 -translate-y-2 ring-4 ring-white shadow-[0_24px_45px_rgba(0,45,98,.23)] lg:scale-110" : "opacity-80 hover:-translate-y-1 hover:opacity-100"}`}
            >
              <span
                className="absolute -right-12 -top-14 size-48 rounded-full border-[24px] border-white/15"
                aria-hidden="true"
              />
              <span
                className="absolute -bottom-16 -left-12 size-52 rounded-full border-[30px] border-white/15"
                aria-hidden="true"
              />
              <span className="relative flex h-full flex-col justify-between">
                <span className="grid min-h-36 place-items-center rounded-xl border border-white/60 bg-white/90 p-6 shadow-sm">
                  <Image src={brand.logo} alt={brand.name} className="max-h-28 w-auto max-w-full object-contain" />
                </span>
                <span className="flex items-end justify-between gap-2 text-brand-primary">
                  <span className="text-sm font-black tracking-wide">{brand.name}</span>
                  <span
                    className={`size-2 rounded-full ${active === index ? "bg-brand-accent" : "bg-brand-primary/25"}`}
                    aria-hidden="true"
                  />
                </span>
              </span>
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-2 top-1/2 flex -translate-y-1/2 justify-between sm:inset-x-4">
          <button
            type="button"
            onClick={() => select(active - 1)}
            aria-label={t({ th: "ก่อนหน้า", en: "Previous" })}
            className="pointer-events-auto grid size-11 place-items-center rounded-full bg-white text-brand-primary shadow-lg transition hover:bg-brand-primary hover:text-white"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => select(active + 1)}
            aria-label={t({ th: "ถัดไป", en: "Next" })}
            className="pointer-events-auto grid size-11 place-items-center rounded-full bg-brand-primary text-white shadow-lg transition hover:bg-white hover:text-brand-primary"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
