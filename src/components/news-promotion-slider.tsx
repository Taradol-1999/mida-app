"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type NewsPromotionImage = { src: string; alt: string; type: "image" | "video" };
export type NewsPromotionItem = {
  id: string;
  tag: string;
  title: string;
  detail: string;
  href?: string;
  images?: NewsPromotionImage[];
};

export function NewsPromotionSlider({
  items,
  variant = "default",
}: {
  items: NewsPromotionItem[];
  variant?: "default" | "project";
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<{ itemIndex: number; imageIndex: number } | null>(null);
  const [detailIndex, setDetailIndex] = useState<number | null>(null);
  const projectStyle = variant === "project";
  const selectedItem = selected === null ? null : items[selected.itemIndex];
  const selectedImage = selectedItem && selected ? selectedItem.images?.[selected.imageIndex] : null;
  const detailItem = detailIndex === null ? null : items[detailIndex];
  const loopItems = items.length > 1 ? [items[items.length - 1], ...items, items[0]] : items;

  useEffect(() => {
    if (!selected && detailIndex === null) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (selected) setSelected(null);
        else setDetailIndex(null);
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        setSelected((current) => {
          if (!current) return null;
          const imageCount = items[current.itemIndex].images?.length ?? 1;
          return {
            ...current,
            imageIndex: (current.imageIndex + (event.key === "ArrowLeft" ? -1 : 1) + imageCount) % imageCount,
          };
        });
      }
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [detailIndex, items, selected]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || items.length <= 1) return;

    const cards = Array.from(track.children) as HTMLElement[];
    const firstOriginal = cards[1];
    const lastOriginal = cards[items.length];
    if (!firstOriginal || !lastOriginal) return;

    // Start at the real first slide, leaving a cloned card on either side.
    track.scrollLeft = firstOriginal.offsetLeft;
    let timer = 0;
    const wrapIfNeeded = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (track.scrollLeft <= 2) track.scrollTo({ left: lastOriginal.offsetLeft, behavior: "auto" });
        // With multiple visible cards, max scrollLeft can be before the cloned
        // first card's offset. Use the actual scroll boundary instead.
        if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 2)
          track.scrollTo({ left: firstOriginal.offsetLeft, behavior: "auto" });
      }, 90);
    };
    track.addEventListener("scroll", wrapIfNeeded, { passive: true });
    return () => {
      window.clearTimeout(timer);
      track.removeEventListener("scroll", wrapIfNeeded);
    };
  }, [items]);

  function move(direction: -1 | 1) {
    const track = trackRef.current;
    if (!track) return;
    const cards = Array.from(track.children) as HTMLElement[];
    if (!cards.length) return;
    const step = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft : track.clientWidth;
    track.scrollBy({ left: direction * step, behavior: "smooth" });
  }
  function moveImage(direction: -1 | 1) {
    setSelected((current) => {
      if (!current) return null;
      const imageCount = items[current.itemIndex].images?.length ?? 1;
      return { ...current, imageIndex: (current.imageIndex + direction + imageCount) % imageCount };
    });
  }

  return (
    <>
      <div className="mt-0">
        <div className="mb-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="ข่าวก่อนหน้า"
            className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-brand-primary shadow-sm transition hover:border-brand-primary hover:bg-brand-primary hover:text-white"
          >
            <i className="fa-solid fa-chevron-left" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="ข่าวถัดไป"
            className="grid size-10 place-items-center rounded-full bg-brand-primary text-white shadow-sm transition hover:bg-brand-text"
          >
            <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          </button>
        </div>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-4 pt-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
        >
          {loopItems.map((item, loopIndex) => {
            const index = items.length > 1 ? (loopIndex - 1 + items.length) % items.length : loopIndex;
            const firstImage = item.images?.[0];
            const contentIcon = item.tag === "PROMOTION" ? "fa-tags" : "fa-newspaper";
            const mediaPreview = firstImage && (
              <>
                {firstImage.type === "video" ? (
                  <video src={firstImage.src} muted playsInline preload="metadata" className="size-full object-cover" />
                ) : (
                  <Image
                    src={firstImage.src}
                    alt={firstImage.alt}
                    fill
                    unoptimized
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                )}
                <span className="absolute inset-0 bg-brand-overlay/20 transition group-hover:bg-brand-overlay/35" />
                <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-brand-primary shadow">
                  <i className="fa-regular fa-images" aria-hidden="true" />
                  {item.images?.length ?? 0} รูป
                </span>
              </>
            );
            const body = (
              <>
                <div>
                  <p className="inline-flex rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-extrabold text-brand-primary">
                    {item.tag}
                  </p>
                  <h3 className="mt-3 text-xl font-extrabold text-brand-primary">{item.title}</h3>
                  <p className={`mt-3 text-sm leading-7 line-clamp-2 text-slate-500`}>{item.detail}</p>
                </div>
                {item.href && (
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand-primary">
                    ดูข้อมูลโครงการ <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                )}
                {projectStyle && (
                  <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-brand-primary">
                    ดูรายละเอียด <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                  </span>
                )}
              </>
            );
            const emptyMediaPreview = (
              <>
                <span className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,176,64,.95),transparent_38%),linear-gradient(135deg,#002D62,#063f82)]" />
                <span
                  className="absolute -right-8 -bottom-12 text-[11rem] leading-none text-white/10"
                  aria-hidden="true"
                >
                  <i className={`fa-solid ${contentIcon}`} />
                </span>
                <span className="relative flex h-full flex-col items-start justify-between p-5 text-white sm:p-6">
                  <span className="grid size-12 place-items-center rounded-2xl border border-white/30 bg-white/15 text-xl shadow-lg backdrop-blur-sm">
                    <i className={`fa-solid ${contentIcon}`} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.65rem] font-bold tracking-[0.18em] text-brand-accent">
                      MIDA PROPERTY
                    </span>
                    <span className="mt-1 block text-sm font-extrabold">{item.tag}</span>
                  </span>
                </span>
              </>
            );
            return (
              <article
                key={`${item.id}-${loopIndex}`}
                className={`flex min-w-[92%] flex-col snap-start overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:min-w-[calc(50%-0.625rem)] ${projectStyle ? "border border-brand-primary/15 lg:min-w-[calc(50%-0.625rem)]" : "border border-slate-200 lg:min-w-[calc(33.333%-0.875rem)]"}`}
              >
                {firstImage && item.href && !projectStyle ? (
                  <Link
                    href={item.href}
                    className="group relative block aspect-[16/8] w-full overflow-hidden bg-brand-muted text-left"
                    aria-label={`ดูข้อมูลโครงการ ${item.title}`}
                  >
                    {mediaPreview}
                  </Link>
                ) : firstImage ? (
                  <button
                    type="button"
                    onClick={() => setSelected({ itemIndex: index, imageIndex: 0 })}
                    className="group relative block aspect-[16/8] w-full overflow-hidden bg-brand-muted text-left"
                    aria-label={`ดูรูปภาพ ${item.title} ทั้งหมด ${item.images?.length ?? 0} รูป`}
                  >
                    {mediaPreview}
                  </button>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="group relative block aspect-[16/8] w-full overflow-hidden text-left"
                    aria-label={`ดูข้อมูลโครงการ ${item.title}`}
                  >
                    {emptyMediaPreview}
                  </Link>
                ) : projectStyle ? (
                  <button
                    type="button"
                    onClick={() => setDetailIndex(index)}
                    className="group relative block aspect-[16/8] w-full overflow-hidden text-left"
                    aria-label={`ดูรายละเอียด ${item.title}`}
                  >
                    {emptyMediaPreview}
                  </button>
                ) : null}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex min-h-48 flex-1 flex-col p-5 transition hover:bg-brand-soft/30 sm:p-6"
                  >
                    {body}
                  </Link>
                ) : projectStyle ? (
                  <button
                    type="button"
                    onClick={() => setDetailIndex(index)}
                    className="flex min-h-48 w-full flex-1 flex-col p-5 text-left transition hover:bg-brand-soft/30 sm:p-6"
                    aria-label={`ดูรายละเอียด ${item.title}`}
                  >
                    {body}
                  </button>
                ) : (
                  <div className="p-5 sm:p-6">{body}</div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {selectedImage && selected && selectedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`รูปภาพ ${selectedItem.title}`}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/90 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setSelected(null)}
        >
          <button
            type="button"
            onClick={() => setSelected(null)}
            aria-label="ปิดรูปภาพ"
            className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-white text-brand-primary shadow-lg"
          >
            <i className="fa-solid fa-xmark" />
          </button>
          <div className="relative h-[78vh] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
            {selectedImage.type === "video" ? (
              <video src={selectedImage.src} controls autoPlay playsInline className="size-full object-contain" />
            ) : (
              <Image
                src={selectedImage.src}
                alt={selectedImage.alt}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            )}
            {(selectedItem.images?.length ?? 0) > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => moveImage(-1)}
                  aria-label="รูปก่อนหน้า"
                  className="absolute top-1/2 left-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-lg sm:-left-15"
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button
                  type="button"
                  onClick={() => moveImage(1)}
                  aria-label="รูปถัดไป"
                  className="absolute top-1/2 right-2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-brand-primary shadow-lg sm:-right-15"
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </>
            )}
            <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-xs font-bold text-white">
              {selected.imageIndex + 1} / {selectedItem.images?.length ?? 1}
            </span>
          </div>
        </div>
      )}

      {detailItem && detailIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`รายละเอียด ${detailItem.title}`}
          className="fixed inset-0 z-50 grid place-items-center bg-brand-overlay/70 p-3 backdrop-blur-sm sm:p-6"
          onClick={() => setDetailIndex(null)}
        >
          <article
            className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
              <div>
                <p className="inline-flex rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-extrabold text-brand-primary">
                  {detailItem.tag}
                </p>
                <h3 className="mt-3 text-xl font-extrabold text-brand-primary sm:text-2xl">{detailItem.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailIndex(null)}
                aria-label="ปิดรายละเอียด"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-brand-primary transition hover:bg-brand-soft"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </header>
            <div className="px-5 py-6 sm:px-7">
              <p className="whitespace-pre-line text-sm leading-7 text-slate-600">
                {detailItem.detail || "ยังไม่มีรายละเอียดเพิ่มเติม"}
              </p>
              {(detailItem.images?.length ?? 0) > 0 && (
                <section className="mt-7 border-t border-slate-100 pt-6">
                  <h4 className="text-sm font-bold text-brand-primary">
                    <i className="fa-regular fa-images mr-2" />
                    อัลบั้มรูปภาพ ({detailItem.images?.length} รูป)
                  </h4>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {detailItem.images?.map((image, imageIndex) => (
                      <button
                        key={`${image.src}-${imageIndex}`}
                        type="button"
                        onClick={() => setSelected({ itemIndex: detailIndex, imageIndex })}
                        className="group relative aspect-square overflow-hidden rounded-xl bg-brand-muted text-left"
                        aria-label={`ดูรูปภาพลำดับที่ ${imageIndex + 1}`}
                      >
                        {image.type === "video" ? (
                          <video
                            src={image.src}
                            muted
                            playsInline
                            preload="metadata"
                            className="size-full object-cover"
                          />
                        ) : (
                          <Image
                            src={image.src}
                            alt={image.alt}
                            fill
                            unoptimized
                            sizes="(min-width: 640px) 12rem, 45vw"
                            className="object-cover transition group-hover:scale-105"
                          />
                        )}
                        <span className="absolute inset-0 grid place-items-center bg-brand-overlay/0 text-white transition group-hover:bg-brand-overlay/35">
                          <i className="fa-solid fa-magnifying-glass-plus opacity-0 transition group-hover:opacity-100" />
                        </span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </article>
        </div>
      )}
    </>
  );
}
