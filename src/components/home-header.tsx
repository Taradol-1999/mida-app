"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { MobileHeaderMenu } from "@/components/mobile-header-menu";
import midaLogo from "@/assets/logos/png/01-mida-property.png";

const nav = [
  { href: "#projects", label: { th: "โครงการ", en: "Projects" } },
  { href: "#living", label: { th: "เครือไมด้า", en: "MIDA Group" } },
  { href: "#promotion", label: { th: "ข่าวสารและโปรโมชั่น", en: "News & Promotions" } },
  { href: "#location", label: { th: "ทำเลที่ตั้ง", en: "Locations" } },
];

export function HomeHeader({ showAdmin }: { showAdmin: boolean }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 40);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header className={`home-page-header fixed inset-x-0 top-0 z-80 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="home-page-header-bar mx-auto grid h-14 grid-cols-[1fr_auto_1fr] items-center px-3 sm:h-16 sm:px-5">
        <MobileHeaderMenu
          items={nav}
          showAdmin={showAdmin}
          label={{ th: "เมนูหลัก", en: "Main menu" }}
          desktopBreakpoint="always"
          homeStyle
        />
        <Link
          href="/"
          aria-label="MIDA Property"
          className="inline-flex items-center justify-center focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          <Image src={midaLogo} alt="MIDA Property" className="h-10 w-auto object-contain sm:h-12" priority />
        </Link>
        <a
          href="#projects"
          aria-label="ค้นหาโครงการ"
          className="ml-auto grid size-10 place-items-center rounded-full text-brand-primary transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
