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
  return (
    <div className="mt-7">
      <div
        role="tablist"
        aria-label={t({ th: "รูปแบบแผนที่", en: "Map views" })}
        className="mb-4 flex w-fit max-w-full gap-1 rounded-xl bg-brand-soft p-1"
      >
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            id={`${id}-${tab}-tab`}
            aria-controls={`${id}-${tab}-panel`}
            aria-selected={active === tab}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setSelected(tab)}
            onKeyDown={(event) => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
              event.preventDefault();
              const next =
                event.key === "Home"
                  ? tabs[0]
                  : event.key === "End"
                    ? tabs[tabs.length - 1]
                    : tabs[(tabs.indexOf(tab) + 1) % tabs.length];
              setSelected(next);
              document.getElementById(`${id}-${next}-tab`)?.focus();
            }}
            className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-brand-primary ${active === tab ? "bg-brand-primary text-white shadow-sm" : "text-brand-primary hover:bg-white/70"}`}
          >
            <i className={`fa-solid ${tab === "image" ? "fa-image" : "fa-map-location-dot"}`} aria-hidden="true" />
            {tab === "image" ? t({ th: "รูปแผนที่", en: "Map image" }) : "Google Maps"}
          </button>
        ))}
      </div>
      <div className="relative h-80 overflow-hidden rounded-2xl border border-brand-primary/15 bg-slate-50 shadow-sm sm:h-96 lg:h-112">
        {imageUrl && (
          <div
            role="tabpanel"
            id={`${id}-image-panel`}
            aria-labelledby={`${id}-image-tab`}
            aria-hidden={active !== "image"}
            inert={active !== "image"}
            tabIndex={0}
            className={`absolute inset-0 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${active === "image" ? "z-10 translate-y-0 opacity-100" : "pointer-events-none z-0 translate-y-2 opacity-0"}`}
          >
            <a href={directionsHref} target="_blank" rel="noopener noreferrer" className="relative block size-full">
              <Image
                src={imageUrl}
                alt={`${t({ th: "แผนที่", en: "Map" })} ${projectName}`}
                fill
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
          className={`absolute inset-0 transition-[opacity,transform] duration-400 ease-out motion-reduce:transition-none ${active === "google" ? "z-10 translate-y-0 opacity-100" : "pointer-events-none z-0 translate-y-2 opacity-0"}`}
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
