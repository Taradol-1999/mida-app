"use client";

import { useEffect, useState } from "react";
import { type BilingualText, useTranslation } from "@/components/language-provider";

type NavItem = { href: string; label: string | BilingualText };

export function HeaderNav({
  items,
  variant = "desktop",
  onNavigate,
}: {
  items: NavItem[];
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const [activeHref, setActiveHref] = useState("");
  const sectionKeys = items.map((item) => item.href).join("|");
  const { t } = useTranslation();

  useEffect(() => {
    let frame = 0;
    const sections = sectionKeys.split("|").flatMap((href) => {
      const element = document.getElementById(href.slice(1));
      return element ? [{ href, element }] : [];
    });

    function updateActive() {
      frame = 0;
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88;
      // Anchor links stop just below the 88px sticky header. Keep the active
      // state near that same line so the next menu does not activate too early.
      const marker = scrollPadding + 16;
      let current = "";
      for (const { href, element } of sections) {
        if (element.getBoundingClientRect().top <= marker) current = href;
      }
      setActiveHref(current);
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(updateActive);
    }

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    window.addEventListener("hashchange", scheduleUpdate);
    const observer = new ResizeObserver(scheduleUpdate);
    observer.observe(document.body);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.removeEventListener("hashchange", scheduleUpdate);
      observer.disconnect();
    };
  }, [sectionKeys]);
  return items.map((item) => (
    <a
      key={item.href}
      href={item.href}
      onClick={(event) => {
        setActiveHref(item.href);
        event.currentTarget.closest("details")?.removeAttribute("open");
        onNavigate?.();
      }}
      aria-current={activeHref === item.href ? "location" : undefined}
      className={`header-nav-link ${variant === "mobile" ? "header-nav-link-mobile" : "header-nav-link-desktop"} ${
        activeHref === item.href ? "is-active" : ""
      }`}
    >
      {typeof item.label === "string" ? item.label : t(item.label)}
    </a>
  ));
}
