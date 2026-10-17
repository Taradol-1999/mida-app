import Link from "next/link";
import Image from "next/image";
import { MobileHeaderMenu } from "@/components/mobile-header-menu";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectLocationMap } from "@/components/project-location-map";
import { MidaLivingShowcase } from "@/components/mida-living-showcase";
import { SiteFooter } from "@/components/site-footer";
import { T } from "@/components/language-provider";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MapProject } from "@/lib/project-map";
import midaLogo from "@/assets/logos/png/01-mida-property.png";

export const dynamic = "force-dynamic";

const nav = [
  { href: "#projects", label: { th: "โครงการ", en: "Projects" } },
  { href: "#living", label: { th: "เครือไมด้า", en: "MIDA Group" } },
  { href: "#promotion", label: { th: "ข่าวสารและโปรโมชั่น", en: "News & Promotions" } },
  { href: "#location", label: { th: "ทำเลที่ตั้ง", en: "Locations" } },
];

const defaultUpdates: NewsPromotionItem[] = [
  {
    id: "default-promotion",
    tag: "PROMOTION",
    title: "สิทธิพิเศษสำหรับครอบครัว MIDA",
    titleEn: "Exclusive Privileges for MIDA Families",
    detail: "ข้อเสนอพิเศษสำหรับลูกค้าใหม่และลูกค้า MIDA Family",
    detailEn: "Special offers for new customers and MIDA Family members.",
  },
  {
    id: "default-news",
    tag: "NEWS",
    title: "MIDA ร่วมมือกับ ธอส.",
    titleEn: "MIDA Partners with GHB",
    detail: "สนับสนุนการเข้าถึงที่อยู่อาศัยอย่างมั่นคง",
    detailEn: "Supporting secure access to home ownership.",
  },
  {
    id: "default-event",
    tag: "EVENT",
    title: "พบกันที่งาน MIDA Home Fair",
    titleEn: "Meet Us at MIDA Home Fair",
    detail: "เยี่ยมชมโครงการและรับข้อเสนอภายในงาน",
    detailEn: "Visit our projects and receive exclusive event offers.",
  },
];

async function homeData() {
  try {
    const [contentRows, promotions, news, projectRows] = await Promise.all([
      prisma.siteContent.findMany({
        select: { id: true, content_key: true, title: true, title_en: true, body: true, body_en: true },
      }),
      prisma.promotion.findMany({
        where: { is_published: true },
        include: { project: { select: { slug: true } } },
        orderBy: { created_at: "desc" },
        take: 12,
      }),
      prisma.newsItem.findMany({
        where: { is_published: true },
        include: { project: { select: { slug: true } } },
        orderBy: { published_at: "desc" },
        take: 12,
      }),
      prisma.project.findMany({
        where: { status: { not: "ARCHIVED" } },
        select: {
          id: true,
          slug: true,
          name_th: true,
          name_en: true,
          location: true,
          location_en: true,
          latitude: true,
          longitude: true,
          settings: true,
        },
        orderBy: { name_th: "asc" },
      }),
    ]);
    // Keep the essential homepage content available while a running dev server
    // is refreshed after a Prisma schema update. The curated-project list is an
    // enhancement; it must never hide the Hero banner or the rest of the page.
    const homepageProjectDelegate = prisma.homepageProject;
    const homepageRows = homepageProjectDelegate
      ? await homepageProjectDelegate
          .findMany({
            where: { project: { status: { not: "ARCHIVED" } } },
            select: { project_id: true },
            orderBy: { sort_order: "asc" },
          })
          .catch(() => null)
      : null;
    const homeHero = contentRows.find((row) => row.content_key === "home_hero");
    const heroImageRows = homeHero
      ? await prisma.mediaAsset.findMany({
          where: { entity_type: "site-content", entity_id: homeHero.id, media_kind: "hero" },
          orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
        })
      : [];
    const updateRows = [
      ...promotions.map((item) => ({
        id: item.id,
        entityType: "promotions" as const,
        tag: "PROMOTION",
        title: item.title,
        titleEn: item.title_en,
        detail: item.body ?? "",
        detailEn: item.body_en,
        date: item.created_at,
        projectSlug: item.project?.slug,
      })),
      ...news.map((item) => ({
        id: item.id,
        entityType: "news" as const,
        tag: item.category,
        title: item.title,
        titleEn: item.title_en,
        detail: item.body ?? "",
        detailEn: item.body_en,
        date: item.published_at,
        projectSlug: item.project?.slug,
      })),
    ]
      .sort((a, b) => (b.date?.getTime() ?? 0) - (a.date?.getTime() ?? 0))
      .slice(0, 12);
    const updateMedia = await prisma.mediaAsset.findMany({
      where: {
        media_kind: "gallery",
        OR: [
          {
            entity_type: "promotions",
            entity_id: { in: updateRows.filter((row) => row.entityType === "promotions").map((row) => row.id) },
          },
          {
            entity_type: "news",
            entity_id: { in: updateRows.filter((row) => row.entityType === "news").map((row) => row.id) },
          },
        ],
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    const mediaByItem = new Map<string, typeof updateMedia>();
    for (const item of updateMedia) {
      const key = `${item.entity_type}:${item.entity_id}`;
      mediaByItem.set(key, [...(mediaByItem.get(key) ?? []), item]);
    }
    return {
      content: Object.fromEntries(
        contentRows.map((row) => [
          row.content_key,
          { title: row.title, title_en: row.title_en, body: row.body, body_en: row.body_en },
        ]),
      ),
      updates: updateRows.length
        ? updateRows.map((row) => ({
            id: `${row.entityType}-${row.id}`,
            tag: String(row.tag),
            title: String(row.title),
            titleEn: row.titleEn,
            detail: String(row.detail),
            detailEn: row.detailEn,
            href: row.projectSlug ? `/projects/${row.projectSlug}#project-promo-news` : undefined,
            images: (mediaByItem.get(`${row.entityType}:${row.id}`) ?? []).map((media) => ({
              src: `/api/admin/media?entityType=${row.entityType}&entityId=${row.id}&mediaKind=gallery&mediaId=${media.id}`,
              alt: String(media.original_name || row.title),
              type: String(media.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
            })),
          }))
        : defaultUpdates,
      heroImages: heroImageRows.map((row) => ({
        src: `/api/admin/media?entityType=site-content&entityId=${homeHero?.id}&mediaKind=hero&mediaId=${row.id}`,
        alt: String(row.original_name || "แบนเนอร์ MIDA Property"),
        type: String(row.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
      })),
      mapProjects: projectRows.map((row): MapProject => ({
        id: row.id,
        slug: row.slug,
        name: row.name_th,
        nameEn: row.name_en,
        location: row.location,
        locationEn: row.location_en,
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        mapUrl: row.settings?.map_url ?? null,
      })),
      homepageProjectIds: homepageRows?.map((row) => row.project_id),
    };
  } catch {
    return {
      content: {},
      updates: defaultUpdates,
      heroImages: [],
      mapProjects: [] as MapProject[],
      homepageProjectIds: undefined as string[] | undefined,
    };
  }
}

export default async function HomePage() {
  const [{ content, updates, heroImages, mapProjects, homepageProjectIds }, session] = await Promise.all([
    homeData(),
    getSession(),
  ]);
  return (
    <main>
      <header className="absolute inset-x-0 top-0 z-[80] px-3 pt-3 sm:px-6 sm:pt-5">
        <div className="mx-auto grid h-14 w-full max-w-6xl grid-cols-[1fr_auto_1fr] items-center rounded-full border border-white/70 bg-white/94 px-3 shadow-[0_14px_45px_rgba(0,28,66,0.18)] backdrop-blur-xl sm:h-16 sm:px-5">
          <MobileHeaderMenu
            items={nav}
            showAdmin={Boolean(session)}
            label={{ th: "เมนูหลัก", en: "Main menu" }}
            desktopBreakpoint="always"
            homeStyle
          />
          <Link
            href="/"
            aria-label="MIDA Property"
            className="inline-flex items-center justify-center focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-brand-primary"
          >
            <Image src={midaLogo} alt="MIDA Property" className="h-11 w-auto object-contain sm:h-12" priority />
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
      <HeroImageSlider
        variant="home"
        images={heroImages}
        title={content.home_hero?.title ?? ""}
        titleEn={content.home_hero?.title_en}
        description={content.home_hero?.body ?? ""}
        descriptionEn={content.home_hero?.body_en}
      />
      <div className="bg-[#eaf4fb]">
        <ProjectFilter projectIds={homepageProjectIds} allProjectsHref="/projects" />
        <MidaLivingShowcase />
      </div>
      <section id="promotion" className="relative overflow-hidden bg-[#003b73] py-16 text-white sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(255,255,255,.1),transparent_35%),linear-gradient(160deg,#063b71,#002d62)]" />
        <div className="container-page relative grid items-center gap-8 lg:grid-cols-[minmax(220px,0.32fr)_minmax(0,0.68fr)] lg:gap-12">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-brand-accent">MIDA STORIES</p>
            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              <T th="เรื่องราวที่น่าสนใจ" en="Stories worth exploring" />
            </h2>
            <p className="mt-4 max-w-md text-sm leading-7 text-blue-100">
              <T
                th="รวมบทความ ข่าวสาร และไลฟ์สไตล์ของครอบครัว MIDA"
                en="News, ideas, and stories from the MIDA community."
              />
            </p>
            <a
              href="#promotion-news"
              className="mt-6 inline-flex min-h-11 items-center gap-3 rounded-full bg-brand-accent px-5 text-sm font-bold text-brand-primary transition hover:bg-white"
            >
              <T th="ติดตามความเคลื่อนไหว" en="Explore the latest" />
              <i className="fa-solid fa-arrow-right" aria-hidden="true" />
            </a>
          </div>
          <div id="promotion-news" className="min-w-0">
            <NewsPromotionSlider items={updates} variant="home" />
          </div>
        </div>
      </section>
      <section id="location" className="bg-[#eaf4fb] py-14 sm:py-18">
        <div className="container-page">
          <div className="mb-7 max-w-2xl">
            <div className="gold-rule" />
            <p className="mt-4 text-sm font-bold tracking-widest text-brand-text">MIDA LOCATION</p>
            <h2 className="section-title mt-2">
              <T th="ทำเลโครงการ MIDA PROPERTY" en="MIDA PROPERTY Locations" />
            </h2>
            <p className="mt-3 leading-7 text-brand-text">
              <T
                th="ดูตำแหน่งโครงการทั้งหมด และกดเลือกโครงการเพื่อเปิดเส้นทางใน Google Maps"
                en="View every project location and select a project for directions in Google Maps."
              />
            </p>
          </div>
          <ProjectLocationMap
            projects={mapProjects}
            center={{
              name: "MIDA PROPERTY",
              nameEn: "MIDA PROPERTY",
              address: "267 ถนนจรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร 10700",
              addressEn: "267 Charansanitwong Road, Bang O, Bang Phlat, Bangkok 10700, Thailand",
              latitude: 13.8040816,
              longitude: 100.5121667,
            }}
          />
        </div>
      </section>
      <SiteFooter contact={content.contact?.body} contactEn={content.contact?.body_en} />
    </main>
  );
}
