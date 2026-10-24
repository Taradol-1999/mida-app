"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import type { BilingualText } from "@/components/language-provider";
import { useTranslation } from "@/components/language-provider";
import midaLogo from "@/assets/logos/png/02-by-mida.png";

const socialLinks = [
  {
    href: "https://www.facebook.com/midapropertycompany/",
    label: "Facebook",
    icon: "fa-facebook-f",
    color: "bg-social-facebook",
  },
  {
    href: "https://www.youtube.com/channel/UCB7h58xbypfs8dIs7WBFWRw",
    label: "YouTube",
    icon: "fa-youtube",
    color: "bg-social-youtube",
  },
];

export function SiteFooter({
  projectName,
  projectNameEn,
  logoUrl,
  navigation,
  contact,
  contactEn,
  facebookUrl,
  lineUrl,
  tiktokUrl,
  youtubeUrl,
  messengerUrl,
  phone,
  email,
}: {
  projectName?: string;
  projectNameEn?: string | null;
  logoUrl?: string | null;
  navigation?: { href: string; label: BilingualText }[];
  contact?: string | null;
  contactEn?: string | null;
  facebookUrl?: string | null;
  lineUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  messengerUrl?: string | null;
  phone?: string | null;
  email?: string | null;
}) {
  const { t } = useTranslation();
  const [failedLogo, setFailedLogo] = useState<string | null>(null);
  const customLogo = logoUrl && failedLogo !== logoUrl ? logoUrl : null;
  const displayName = projectName ? t({ th: projectName, en: projectNameEn || projectName }) : "MIDA PROPERTY";
  const socials = [
    { ...socialLinks[0], href: facebookUrl || (projectName ? undefined : socialLinks[0].href) },
    { ...socialLinks[1], href: youtubeUrl },
    { href: lineUrl, label: "LINE", icon: "fa-line", color: "bg-social-line-footer" },
    { href: messengerUrl, label: "Messenger", icon: "fa-facebook-messenger", color: "bg-social-messenger" },
    { href: tiktokUrl, label: "TikTok", icon: "fa-tiktok", color: "bg-social-tiktok" },
  ].filter((social) => Boolean(social.href));

  return (
    <footer id="contact" className="bg-brand-primary text-white">
      <div className="container-page mx-auto grid w-full gap-7 py-8 sm:grid-cols-2 lg:min-h-42 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,0.7fr)_minmax(0,0.85fr)] lg:gap-8 lg:py-7 xl:gap-12">
        <div className="min-w-0 break-words sm:col-span-2 lg:col-span-1">
          <Link
            href={projectName ? "#project-top" : "/"}
            className="inline-flex max-w-full items-center gap-4 font-bold tracking-[0.02em]"
          >
            <Image
              src={customLogo || midaLogo}
              alt={customLogo ? displayName : "BY MIDA"}
              width={112}
              height={64}
              unoptimized={Boolean(customLogo)}
              onError={() => {
                if (logoUrl) setFailedLogo(logoUrl);
              }}
              className={
                customLogo
                  ? "h-14 w-24 shrink-0 rounded-lg bg-white p-2 object-contain"
                  : "h-7 w-auto shrink-0 brightness-0 invert"
              }
            />
            <span className="min-w-0 break-words text-lg leading-snug lg:text-xl">{displayName}</span>
          </Link>
          <p className="mt-3 max-w-md text-sm leading-6 text-white/75">
            {projectName
              ? t({
                  th: `ข้อมูลและข้อเสนอพิเศษจากโครงการ ${projectName}`,
                  en: `Project information and special offers from ${projectNameEn || projectName}`,
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
          <p className="text-xs font-extrabold tracking-[0.18em] text-footer-accent sm:text-sm">
            {projectName ? t({ th: "สำรวจโครงการ", en: "EXPLORE THE PROJECT" }) : "DISCOVER MIDA"}
          </p>
          <nav className="mt-2 grid gap-2 text-sm leading-relaxed text-white/80 sm:gap-1">
            {navigation ? (
              navigation.map((item) => (
                <Link key={item.href} href={item.href} className="transition hover:text-brand-accent">
                  {t(item.label)}
                </Link>
              ))
            ) : (
              <>
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
              </>
            )}
            {projectName && (
              <Link href="/projects" className="transition hover:text-brand-accent">
                {t({ th: "โครงการทั้งหมดของ MIDA", en: "All MIDA Projects" })}
              </Link>
            )}
          </nav>
        </div>

        <div>
          <p className="text-xs font-extrabold tracking-[0.18em] text-footer-accent sm:text-sm">
            {projectName ? t({ th: "ติดต่อโครงการ", en: "CONTACT THE PROJECT" }) : "FOLLOW MIDA PROPERTY"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-white/80">
            {t({
              th: projectName
                ? "สอบถามข้อมูลและรับข้อเสนอพิเศษจากโครงการ"
                : "ติดตามข่าวสาร โครงการใหม่ และกิจกรรมพิเศษของเรา",
              en: projectName
                ? "Contact us for project information and special offers."
                : "Follow our news, new projects, and special events.",
            })}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 md:gap-2.5">
            {socials.map((social) => {
              const icon = <i className={`fa-brands ${social.icon}`} aria-hidden="true" />;
              const className = `grid size-9 place-items-center rounded-[3px] text-lg text-white md:size-6 md:text-sm ${social.color}`;
              return (
                <a
                  key={social.label}
                  href={social.href ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t({
                    th: `ติดตาม ${projectName || "MIDA Property"} บน ${social.label}`,
                    en: `Follow ${projectNameEn || projectName || "MIDA Property"} on ${social.label}`,
                  })}
                  className={`${className} transition hover:-translate-y-0.5 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white`}
                >
                  {icon}
                </a>
              );
            })}
          </div>
          {phone && (
            <a
              href={`tel:${phone.replace(/[^\d+]/g, "")}`}
              className="mt-3 block w-fit max-w-full break-words text-sm text-white/80 transition hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-white"
            >
              TEL : {phone}
            </a>
          )}
          {email && (
            <a
              href={`mailto:${encodeURIComponent(email)}`}
              className="mt-2 block w-fit max-w-full break-all text-sm text-white/80 transition hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-white"
            >
              <i className="fa-solid fa-envelope mr-2" aria-hidden="true" />
              {email}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
