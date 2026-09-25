"use client";

import { useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange);
  return () => window.removeEventListener("hashchange", onChange);
}

export function HeaderNav({ items }: { items: { href: string; label: string }[] }) {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  return items.map((item) => (
    <a
      key={item.href}
      href={item.href}
      aria-current={hash === item.href ? "location" : undefined}
      className={`border-b-2 pb-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-primary ${
        hash === item.href
          ? "border-brand-accent text-brand-primary"
          : "border-transparent hover:border-brand-accent hover:text-brand-primary"
      }`}
    >
      {item.label}
    </a>
  ));
}
