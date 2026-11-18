"use client";

import Image from "next/image";
import { useId, useState } from "react";
import { useTranslation } from "@/components/language-provider";

export function ProjectMapTabs({
  imageUrl,
  embedUrl,
  directionsHref,
  projectName,
}: {
  imageUrl?: string;
  embedUrl: string;
  directionsHref: string;
  projectName: string;
}) {
  const { t } = useTranslation();
  const id = useId();
  const [selected, setSelected] = useState<"image" | "google">(imageUrl ? "image" : "google");
  const tabs: ("image" | "google")[] = imageUrl ? ["image", "google"] : ["google"];
  const active = imageUrl ? selected : "google";
  const activeIndex = tabs.indexOf(active);
  return (
    <div className="mt-7">
      <div className="mb-5 flex justify-center sm:justify-start">
        <div
          role="tablist"
          aria-label={t({ th: "รูปแบบแผนที่", en: "Map views" })}
          className={`relative grid w-full max-w-md gap-1 rounded-2xl border border-brand-primary/10 bg-white/90 p-1.5 shadow-[0_10px_30px_rgba(0,45,98,0.12)] backdrop-blur-sm ${tabs.length === 2 ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <span
            aria-hidden="true"
            className={`absolute inset-y-1.5 left-1.5 rounded-xl bg-linear-to-r from-brand-primary to-location-blue shadow-[0_8px_20px_rgba(0,45,98,0.28)] transition-transform duration-500 ease-out motion-reduce:transition-none ${tabs.length === 2 ? "w-[calc(50%-0.5rem)]" : "right-1.5"}`}
            style={tabs.length === 2 ? { transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))` } : undefined}
          />
          {tabs.map((tab) => {
            const isActive = active === tab;
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                id={`${id}-${tab}-tab`}
                aria-controls={`${id}-${tab}-panel`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setSelected(tab)}
                onKeyDown={(event) => {
                  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
                  event.preventDefault();
                  const index = tabs.indexOf(tab);
                  const next =
                    event.key === "Home"
                      ? tabs[0]
                      : event.key === "End"
                        ? tabs[tabs.length - 1]
                        : tabs[(index + (event.key === "ArrowLeft" ? -1 : 1) + tabs.length) % tabs.length];
                  setSelected(next);
                  document.getElementById(`${id}-${next}-tab`)?.focus();
                }}
                className={`relative z-10 flex min-h-15 min-w-0 items-center justify-center gap-2.5 rounded-xl px-3 py-2 text-left transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${isActive ? "text-white" : "text-brand-primary hover:bg-brand-soft/70"}`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-lg transition duration-300 ${isActive ? "bg-white/15 text-brand-accent" : "bg-brand-soft text-brand-primary"}`}
                >
                  <i
                    className={`fa-solid ${tab === "image" ? "fa-image" : "fa-map-location-dot"}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold">
                    {tab === "image" ? t({ th: "รูปแผนที่", en: "Map image" }) : "Google Maps"}
                  </span>
                  <span className={`hidden truncate text-[0.65rem] font-medium sm:block ${isActive ? "text-white/70" : "text-slate-400"}`}>
                    {tab === "image"
                      ? t({ th: "ภาพทำเลโครงการ", en: "Project location image" })
                      : t({ th: "แผนที่แบบโต้ตอบ", en: "Interactive map" })}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="relative h-80 overflow-hidden rounded-3xl border border-brand-primary/15 bg-slate-50 shadow-[0_18px_45px_rgba(0,45,98,0.12)] sm:h-96 lg:h-112">
        {imageUrl && (
          <div
            role="tabpanel"
            id={`${id}-image-panel`}
            aria-labelledby={`${id}-image-tab`}
            aria-hidden={active !== "image"}
            inert={active !== "image"}
            tabIndex={0}
            className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${active === "image" ? "z-10 scale-100 opacity-100" : "pointer-events-none z-0 scale-[0.985] opacity-0"}`}
          >
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="relative block size-full">
              <Image
                src={imageUrl}
                alt={`${t({ th: "แผนที่", en: "Map" })} ${projectName}`}
                fill
                loading="lazy"
                sizes="100vw"
                unoptimized
                className="object-contain"
              />
            </a>
          </div>
        )}
        <div
          role="tabpanel"
          id={`${id}-google-panel`}
          aria-labelledby={`${id}-google-tab`}
          aria-hidden={active !== "google"}
          inert={active !== "google"}
          tabIndex={0}
          className={`absolute inset-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none ${active === "google" ? "z-10 scale-100 opacity-100" : "pointer-events-none z-0 scale-[0.985] opacity-0"}`}
        >
          <iframe
            src={embedUrl}
            title={`Google Maps — ${projectName}`}
            className="size-full border-0"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
