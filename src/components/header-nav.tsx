"use client";

import { useEffect, useState } from "react";

export function HeaderNav({ items }: { items: { href: string; label: string }[] }) {
  const [activeHref, setActiveHref] = useState("");
  const sectionKeys = items.map((item) => item.href).join("|");

  useEffect(() => {
    let frame = 0;
    const sections = sectionKeys.split("|").flatMap((href) => {
      const element = document.getElementById(href.slice(1));
      return element ? [{ href, element }] : [];
    });

    function updateActive() {
      frame = 0;
      const scrollPadding = Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 88;
      const marker = scrollPadding + 80;
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
      onClick={() => setActiveHref(item.href)}
      aria-current={activeHref === item.href ? "location" : undefined}
      className={`border-b-2 pb-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary ${
        activeHref === item.href
          ? "border-brand-accent text-brand-primary"
          : "border-transparent hover:border-brand-accent hover:text-brand-primary"
      }`}
    >
      {item.label}
    </a>
  ));
}
