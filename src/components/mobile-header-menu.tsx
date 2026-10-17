"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { HeaderNav } from "@/components/header-nav";
import { type BilingualText, LanguageToggle, useTranslation } from "@/components/language-provider";

type NavItem = { href: string; label: string | BilingualText };

export function MobileHeaderMenu({
  items,
  showAdmin = false,
  label,
  desktopBreakpoint = "lg",
}: {
  items: NavItem[];
  showAdmin?: boolean;
  label: BilingualText;
  desktopBreakpoint?: "lg" | "xl";
}) {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className={desktopBreakpoint === "xl" ? "xl:hidden" : "lg:hidden"}>
      <button
        type="button"
        className="site-header-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        <span className="sr-only">
          {open ? t({ th: "ปิดเมนู", en: "Close menu" }) : t({ th: "เปิดเมนู", en: "Open menu" })}
        </span>
      </button>

      {open &&
        createPortal(
          <div id={menuId} className="mobile-navigation-layer" role="dialog" aria-modal="true" aria-label={t(label)}>
            <nav className="mobile-navigation-panel" aria-label={t(label)}>
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3.5 sm:px-5 sm:py-4">
                <div>
                  <p className="text-[0.65rem] font-extrabold tracking-[0.18em] text-brand-accent">MIDA PROPERTY</p>
                  <p className="mt-0.5 text-sm font-extrabold text-brand-primary">{t(label)}</p>
                </div>
              </div>
              <div className="p-2.5 sm:p-3">
                <HeaderNav items={items} variant="mobile" onNavigate={() => setOpen(false)} />
                {showAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className="mt-2 flex min-h-11 items-center rounded-xl bg-brand-soft px-3.5 py-2.5 font-semibold text-brand-primary transition hover:bg-brand-primary hover:text-white"
                  >
                    <i className="fa-solid fa-user-shield mr-2" aria-hidden="true" />
                    {t({ th: "ผู้ดูแลระบบ", en: "Admin" })}
                  </Link>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 sm:px-5 sm:py-3.5">
                <span className="text-xs font-semibold text-slate-500">{t({ th: "เลือกภาษา", en: "Language" })}</span>
                <LanguageToggle />
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
