"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "@/components/language-provider";
import midaLogo from "@/assets/logos/png/02-by-mida.png";

const socialLinks = [
  {
    href: "https://www.facebook.com/midapropertycompany/",
    label: "Facebook",
    icon: "fa-facebook-f",
    color: "bg-[#1789e9]",
  },
  {
    href: "https://www.youtube.com/channel/UCB7h58xbypfs8dIs7WBFWRw",
    label: "YouTube",
    icon: "fa-youtube",
    color: "bg-[#ff1717]",
  },
];

export function SiteFooter({
  projectName,
  contact,
  contactEn,
  facebookUrl,
  lineUrl,
  tiktokUrl,
}: {
  projectName?: string;
  contact?: string | null;
  contactEn?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
  tiktokUrl?: string | null;
}) {
  const { t } = useTranslation();
  const socials = [
    { ...socialLinks[0], href: facebookUrl || socialLinks[0].href },
    socialLinks[1],
    { href: lineUrl, label: "LINE", icon: "fa-line", color: "bg-[#52be42]" },
    { href: tiktokUrl, label: "TikTok", icon: "fa-tiktok", color: "bg-[#1b202d]" },
  ];

  return (
    <footer className="bg-[#08254a] text-white">
      <div className="container-page mx-auto grid w-full gap-9 py-8 md:min-h-42 md:grid-cols-[minmax(0,1.45fr)_minmax(11rem,0.7fr)_minmax(18rem,0.85fr)] md:gap-12 md:py-7">
        <div className="min-w-0">
          <Link href="/" className="inline-flex items-center gap-5 font-bold tracking-[0.02em]">
            <Image src={midaLogo} alt="BY MIDA" className="h-7 w-auto shrink-0 brightness-0 invert" />
            <span className="text-lg whitespace-nowrap lg:text-xl">MIDA PROPERTY</span>
          </Link>
          <p className="mt-3 max-w-md text-xs leading-5 text-white/75 sm:text-sm sm:leading-6">
            {projectName
              ? t({
                  th: `ข้อมูลและข้อเสนอพิเศษจากโครงการ ${projectName}`,
                  en: `Project information and special offers from ${projectName}`,
                })
              : t({
                  th: "พื้นที่ตอบทุกนิยามของคำว่าบ้าน ค้นหาโครงการ MIDA ที่เหมาะกับทุกจังหวะชีวิต",
                  en: "A place that answers every definition of home. Discover MIDA projects for every stage of life.",
                })}
          </p>
          {projectName && contact && (
            <p className="mt-2 text-xs leading-5 text-white/75 sm:text-sm">{t({ th: contact, en: contactEn ?? "" })}</p>
          )}
        </div>

        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-[#f3b54d] sm:text-sm">DISCOVER MIDA</p>
          <nav className="mt-2 grid gap-1 text-xs leading-relaxed text-white/80 sm:text-sm">
            <Link href="/" className="transition hover:text-brand-accent">
              {t({ th: "หน้าแรก", en: "Home" })}
            </Link>
            <Link href="/projects" className="transition hover:text-brand-accent">
              {t({ th: "โครงการทั้งหมด", en: "All Projects" })}
            </Link>
            <Link href="/#promotion" className="transition hover:text-brand-accent">
              {t({ th: "ข่าวสารและโปรโมชั่น", en: "News & Promotions" })}
            </Link>
            <Link href="/projects" className="transition hover:text-brand-accent">
              {t({ th: "ทำเลโครงการ", en: "Project Locations" })}
            </Link>
          </nav>
        </div>

        <div>
          <p className="whitespace-nowrap text-xs font-extrabold tracking-[0.18em] text-[#f3b54d] sm:text-sm">
            FOLLOW MIDA PROPERTY
          </p>
          <p className="mt-2 text-xs leading-relaxed text-white/80 sm:text-sm">
            {t({
              th: "ติดตามข่าวสาร โครงการใหม่ และกิจกรรมพิเศษของเรา",
              en: "Follow our news, new projects, and special events.",
            })}
          </p>
          <div className="mt-2 flex items-center gap-3 md:gap-2.5">
            {socials.map((social) => {
              const icon = <i className={`fa-brands ${social.icon}`} aria-hidden="true" />;
              const className = `grid size-9 place-items-center rounded-[3px] text-lg text-white md:size-6 md:text-sm ${social.color}`;
              return social.href ? (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t({
                    th: `ติดตาม MIDA Property บน ${social.label}`,
                    en: `Follow MIDA Property on ${social.label}`,
                  })}
                  className={`${className} transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                >
                  {icon}
                </a>
              ) : (
                <span key={social.label} aria-label={social.label} className={className}>
                  {icon}
                </span>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-white/80 sm:text-sm">TEL : 02 885 5558</p>
        </div>
      </div>
    </footer>
  );
}
