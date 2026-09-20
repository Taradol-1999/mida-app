"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  description,
  meta,
  actionHref,
  actionLabel,
}: {
  images: HeroMedia[];
  title: string;
  description: string;
  meta?: string;
  actionHref?: string | null;
  actionLabel?: string;
}) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const hasImages = images.length > 0;
  const activeMedia = images[active];

  useEffect(() => {
    if (images.length < 2 || paused || activeMedia?.type === "video") return;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [activeMedia?.type, images.length, paused]);

  function move(direction: -1 | 1) {
    setActive((current) => (current + direction + images.length) % images.length);
  }

  return (
    <section
      className="relative min-h-120 overflow-hidden bg-brand-primary"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="แบนเนอร์หน้าแรก MIDA Property"
    >
      {images.map((image, index) => (
        <div
          key={`${image.src}-${index}`}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === active ? "opacity-100" : "opacity-0"}`}
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
              sizes="100vw"
              className="object-cover"
            />
          )}
        </div>
      ))}
      <div
        className={`absolute inset-0 ${hasImages ? "bg-linear-to-r from-brand-primary/90 via-brand-primary/55 to-transparent" : "hero-shade"}`}
      />

      <div className="container-page relative flex min-h-120 items-center py-24 text-white">
        <div className="w-full max-w-7xl">
          <h1 className="text-4xl font-extrabold leading-tight drop-shadow-md md:text-6xl">{title}</h1>
          <p className="mt-6 text-lg leading-8 text-slate-100 drop-shadow">{description}</p>
          {meta && <p className="mt-5 text-xl font-extrabold text-white drop-shadow">{meta}</p>}
          {actionHref && (
            <a
              href={actionHref}
              download
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-brand-accent/50 bg-brand-accent px-5 py-3 text-sm font-bold text-brand-primary shadow-lg transition hover:-translate-y-0.5 hover:bg-brand-accent-soft"
            >
              <i className="fa-solid fa-file-arrow-down" />
              {actionLabel ?? "ดาวน์โหลด"}
            </a>
          )}
        </div>
      </div>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="แบนเนอร์ก่อนหน้า"
            className="absolute left-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand-primary shadow-lg transition hover:bg-white md:grid"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="แบนเนอร์ถัดไป"
            className="absolute right-4 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-brand-primary shadow-lg transition hover:bg-white md:grid"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
          <div className="absolute inset-x-0 bottom-6 flex justify-center gap-2">
            {images.map((image, index) => (
              <button
                key={`${image.src}-dot`}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`เลือกแบนเนอร์รูปที่ ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={`h-2.5 rounded-full transition-all ${index === active ? "w-8 bg-white" : "w-2.5 bg-white/55 hover:bg-white"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
