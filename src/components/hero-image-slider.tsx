"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/components/language-provider";

type HeroMedia = { src: string; alt: string; type: "image" | "video" };

function HeroVideo({ src, alt, active, onEnded }: { src: string; alt: string; active: boolean; onEnded: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (active) void video.play().catch(() => undefined);
    else video.pause();
  }, [active]);

  return (
    <video
      ref={videoRef}
      src={src}
      aria-label={alt}
      muted
      playsInline
      onEnded={onEnded}
      preload={active ? "auto" : "metadata"}
      className="size-full object-cover"
    />
  );
}

export function HeroImageSlider({
  images,
  title,
  titleEn,
  description,
  descriptionEn,
  meta,
  metaEn,
  actionHref,
  actionLabel,
  actionLabelEn,
  ariaLabelTh,
  ariaLabelEn,
  variant = "default",
}: {
  images: HeroMedia[];
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  meta?: string;
  metaEn?: string;
  actionHref?: string | null;
  actionLabel?: string;
  actionLabelEn?: string;
  ariaLabelTh?: string;
  ariaLabelEn?: string;
  variant?: "default" | "home";
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStartX = useRef<number | null>(null);
  const { t } = useTranslation();
  const hasImages = images.length > 0;
  const homeStyle = variant === "home";
  const activeMedia = images[active];

  useEffect(() => {
    if (images.length < 2 || paused || activeMedia?.type === "video") return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeMedia?.type, images.length, paused]);

  function move(direction: -1 | 1) {
    if (images.length < 2) return;
    setActive((current) => (current + direction + images.length) % images.length);
  }

  function endSwipe(clientX: number) {
    const startX = swipeStartX.current;
    swipeStartX.current = null;
    if (startX === null || Math.abs(clientX - startX) < 42) return;
    move(clientX < startX ? 1 : -1);
  }

  return (
    <section
      className={`relative overflow-hidden bg-brand-primary ${homeStyle ? "min-h-140 sm:min-h-160 lg:min-h-svh" : "min-h-112 sm:min-h-120 lg:min-h-svh"}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={(event) => {
        swipeStartX.current = event.touches[0]?.clientX ?? null;
        setPaused(true);
      }}
      onTouchEnd={(event) => {
        endSwipe(event.changedTouches[0]?.clientX ?? 0);
        setPaused(false);
      }}
      onTouchCancel={() => {
        swipeStartX.current = null;
        setPaused(false);
      }}
      onPointerDown={(event) => {
        if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("a, button"))
          return;
        swipeStartX.current = event.clientX;
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerUp={(event) => {
        if (event.pointerType === "mouse") endSwipe(event.clientX);
      }}
      onPointerCancel={() => {
        swipeStartX.current = null;
      }}
      style={{ touchAction: "pan-y" }}
      aria-roledescription="carousel"
      aria-label={t({
        th: ariaLabelTh ?? "แบนเนอร์หน้าแรก MIDA Property",
        en: ariaLabelEn ?? "MIDA Property hero banner",
      })}
    >
      {images.map((image, index) => (
        <div
          key={`${image.src}-${index}`}
          className={`absolute inset-0 transition-[opacity,transform] duration-700 ease-out ${index === active ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
          aria-hidden={index !== active}
        >
          {image.type === "video" ? (
            <HeroVideo
              src={image.src}
              alt={image.alt}
              active={index === active}
              onEnded={() => setActive((current) => (current + 1) % images.length)}
            />
          ) : (
            <Image
              src={image.src}
              alt={image.alt}
              fill
              unoptimized={image.src.includes("?")}
              priority={index === 0}
              draggable={false}
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>
      ))}
      <div
        className={`absolute inset-0 ${hasImages ? (homeStyle ? "bg-linear-to-r from-brand-primary/75 via-brand-primary/25 to-transparent" : "bg-linear-to-r from-brand-primary/90 via-brand-primary/55 to-transparent") : "hero-shade"}`}
      />

      <div
        className={`container-page relative flex items-center text-white ${homeStyle ? "min-h-140 pb-28 pt-28 sm:min-h-160 sm:pb-36 lg:min-h-svh" : "min-h-112 pb-20 pt-24 sm:min-h-120 sm:pb-24 sm:pt-28 lg:min-h-svh"}`}
      >
        <div className={homeStyle ? "w-full max-w-2xl" : "w-full max-w-5xl"}>
          <h1
            className={`${homeStyle ? "text-[clamp(1.75rem,8vw,2.25rem)] sm:text-5xl lg:text-7xl" : "text-[clamp(1.5rem,7vw,1.875rem)] sm:text-4xl lg:text-6xl"} break-words leading-snug font-extrabold drop-shadow-md`}
          >
            {t({ th: title, en: titleEn ?? "" })}
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-100 drop-shadow sm:mt-6 sm:text-lg sm:leading-8">
            {t({ th: description, en: descriptionEn ?? "" })}
          </p>
          {meta && (
            <p className="mt-4 text-lg font-extrabold text-white drop-shadow sm:mt-5 sm:text-xl">
              {t({ th: meta, en: metaEn ?? "" })}
            </p>
          )}
          {actionHref && (
            <a
              href={actionHref}
              download
              className="mt-5 inline-flex max-w-full items-center gap-2 rounded-xl border border-brand-accent/50 bg-brand-accent px-4 py-2.5 text-sm font-bold text-brand-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-accent-soft sm:mt-6 sm:px-5 sm:py-3"
            >
              <i className="fa-solid fa-file-arrow-down" />
              {t({ th: actionLabel ?? "ดาวน์โหลด", en: actionLabelEn ?? "Download" })}
            </a>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label={t({ th: "แบนเนอร์ก่อนหน้า", en: "Previous banner" })}
            className="absolute inset-y-0 left-0 w-3 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white md:w-6 lg:w-16"
          />
          <button
            type="button"
            onClick={() => move(1)}
            aria-label={t({ th: "แบนเนอร์ถัดไป", en: "Next banner" })}
            className="absolute inset-y-0 right-0 w-3 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-white md:w-6 lg:w-16"
          />
          <div className="absolute inset-x-4 bottom-4 flex flex-wrap justify-center gap-1 sm:bottom-6 sm:gap-2">
            {images.map((image, index) => (
              <button
                key={`${image.src}-dot`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={t({ th: `เลือกแบนเนอร์รูปที่ ${index + 1}`, en: `Select banner ${index + 1}` })}
                aria-current={index === active ? "true" : undefined}
                className="grid size-6 shrink-0 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  className={`h-2 rounded-full transition-all ${index === active ? "w-6 bg-white" : "w-2 bg-white/55 hover:bg-white"}`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
