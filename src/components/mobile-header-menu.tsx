"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { HeaderNav } from "@/components/header-nav";
import { type BilingualText, LanguageToggle, useTranslation } from "@/components/language-provider";

type NavItem = { href: string; label: string | BilingualText };

const propertyTypes = [
  { value: "บ้านเดี่ยว", label: { th: "บ้านเดี่ยว", en: "Detached houses" } },
  { value: "บ้านแฝด", label: { th: "บ้านแฝด", en: "Semi-detached houses" } },
  { value: "ทาวน์โฮม", label: { th: "ทาวน์โฮม", en: "Townhomes" } },
  { value: "อาคารพาณิชย์", label: { th: "อาคารพาณิชย์", en: "Commercial buildings" } },
] as const;

export function MobileHeaderMenu({
  items,
  showAdmin = false,
  label,
  desktopBreakpoint = "lg",
  homeStyle = false,
}: {
  items: NavItem[];
  showAdmin?: boolean;
  label: BilingualText;
  desktopBreakpoint?: "lg" | "xl" | "always";
  homeStyle?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const menuId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const { t } = useTranslation();

  function closeMenu() {
    if (homeStyle) setClosing(true);
    setOpen(false);
  }

  useEffect(() => {
    if (!closing) return;
    const timer = window.setTimeout(() => setClosing(false), 320);
    return () => window.clearTimeout(timer);
  }, [closing]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (homeStyle) setClosing(true);
        setOpen(false);
      }
      if (event.key !== "Tab" || !homeStyle) return;
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [homeStyle, open]);

  return (
    <div className={desktopBreakpoint === "always" ? "" : desktopBreakpoint === "xl" ? "xl:hidden" : "lg:hidden"}>
      <button
        type="button"
        className={homeStyle ? "home-header-menu-trigger" : "site-header-menu-trigger"}
        onClick={() => {
          if (open) closeMenu();
          else {
            setClosing(false);
            setOpen(true);
          }
        }}
        aria-expanded={open}
        aria-controls={menuId}
      >
        <i className={`fa-solid ${open ? "fa-xmark" : "fa-bars"}`} aria-hidden="true" />
        <span className="sr-only">
          {open ? t({ th: "ปิดเมนู", en: "Close menu" }) : t({ th: "เปิดเมนู", en: "Open menu" })}
        </span>
      </button>

      {(open || closing) &&
        createPortal(
          homeStyle ? (
            <div
              id={menuId}
              className="home-sidebar-layer"
              data-state={open ? "open" : "closed"}
              role="dialog"
              aria-modal="true"
              aria-label={t(label)}
            >
              <button
                type="button"
                className="home-sidebar-backdrop"
                onClick={closeMenu}
                aria-hidden="true"
                tabIndex={-1}
              />
              <aside ref={panelRef} className="home-sidebar-panel">
                <div className="home-sidebar-scroll">
                  <div className="flex items-center justify-between border-b border-slate-100 px-6 py-6 sm:px-8">
                    <button
                      ref={closeButtonRef}
                      type="button"
                      onClick={closeMenu}
                      className="inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800 transition hover:text-brand-primary focus-visible:outline-2 focus-visible:outline-brand-primary"
                    >
                      <i className="fa-solid fa-xmark text-xl" aria-hidden="true" />
                      {t({ th: "ปิดเมนู", en: "Close menu" })}
                    </button>
                  </div>

                  <div className="border-b border-slate-100 px-6 py-6 sm:px-8">
                    <p className="mb-3 text-[11px] font-extrabold tracking-[0.16em] text-[#168cc5]">
                      {t({ th: "เมนู", en: "MENU" })}
                    </p>
                    <nav aria-label={t(label)} className="grid gap-1">
                      <HeaderNav items={items} variant="mobile" onNavigate={closeMenu} />
                      <Link href="/projects" onClick={closeMenu} className="header-nav-link header-nav-link-mobile">
                        {t({ th: "โครงการทั้งหมด", en: "All projects" })}
                      </Link>
                    </nav>
                  </div>
                  <div className="px-6 pb-7 pt-7 sm:px-8">
                    <p className="mb-3 text-[11px] font-extrabold tracking-[0.16em] text-[#168cc5]">
                      {t({ th: "ประเภทบ้าน", en: "HOME TYPE" })}
                    </p>
                    <nav aria-label={t({ th: "ประเภทบ้าน", en: "Home types" })} className="grid">
                      {propertyTypes.map((item) => (
                        <Link
                          key={item.value}
                          href={{ pathname: "/projects", query: { type: item.value } }}
                          onClick={closeMenu}
                          className="group home-sidebar-primary-link"
                        >
                          {t(item.label)}
                          <i
                            className="fa-solid fa-arrow-up-right-from-square text-xs opacity-0 transition group-hover:opacity-100"
                            aria-hidden="true"
                          />
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="mt-auto border-t border-slate-100 px-6 py-6 sm:px-8">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-xs font-semibold text-slate-500">{t({ th: "ภาษา", en: "Language" })}</span>
                      <LanguageToggle />
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          ) : (
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
            </div>
          ),
          document.body,
        )}
    </div>
  );
}
