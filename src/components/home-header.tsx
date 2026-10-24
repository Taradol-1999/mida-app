"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { MobileHeaderMenu } from "@/components/mobile-header-menu";
import { type BilingualText } from "@/components/language-provider";
import midaLogo from "@/assets/logos/png/01-mida-property.png";

type HeaderItem = { href: string; label: BilingualText };

const nav: HeaderItem[] = [
  { href: "#projects", label: { th: "โครงการ", en: "Projects" } },
  { href: "#living", label: { th: "เครือไมด้า", en: "MIDA Group" } },
  { href: "#promotion", label: { th: "ข่าวสารและโปรโมชั่น", en: "News & Promotions" } },
];

export function HomeHeader({
  showAdmin,
  innerPage = false,
  items: customItems,
  menuLabel = { th: "เมนูหลัก", en: "Main menu" },
  searchHref,
  logoUrl,
  logoLabel,
}: {
  showAdmin: boolean;
  innerPage?: boolean;
  items?: HeaderItem[];
  menuLabel?: BilingualText;
  searchHref?: string;
  logoUrl?: string | null;
  logoLabel?: BilingualText;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const customLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : null;
  const pathname = usePathname();
  const compact = scrolled || innerPage;
  const items = customItems ?? (pathname === "/" ? nav : nav.map((item) => ({ ...item, href: `/${item.href}` })));
  const projectSearchHref = searchHref ?? (pathname === "/" ? "#projects" : "/#projects");

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 40);
    updateScrollState();
    window.addEventListener("scroll", updateScrollState, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollState);
  }, []);

  return (
    <header className={`home-page-header fixed inset-x-0 top-0 z-80 ${scrolled || innerPage ? "is-scrolled" : ""}`}>
      <div
        className={`home-page-header-bar mx-auto grid grid-cols-[1fr_auto_1fr] items-center px-3 sm:px-5 ${compact ? "h-12 sm:h-14" : "h-15 sm:h-18"}`}
      >
        <MobileHeaderMenu items={items} showAdmin={showAdmin} label={menuLabel} desktopBreakpoint="always" homeStyle />
        <Link
          href="/"
          aria-label={logoLabel?.th || "MIDA Property"}
          className="inline-flex items-center justify-center focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          <Image
            src={customLogo || midaLogo}
            alt={logoLabel?.th || "MIDA Property"}
            width={180}
            height={64}
            unoptimized={Boolean(customLogo)}
            onError={() => {
              if (logoUrl) setFailedLogo(logoUrl);
            }}
            className={`w-auto max-w-40 object-contain transition-[height] duration-400 sm:max-w-48 ${compact ? "h-9 sm:h-10" : "h-11 sm:h-13"}`}
            priority
          />
        </Link>
        <a
          href={projectSearchHref}
          aria-label="ค้นหาโครงการ"
          className="ml-auto grid size-10 place-items-center rounded-full text-brand-primary transition hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand-primary"
        >
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}
