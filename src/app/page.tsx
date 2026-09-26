import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectLocationMap } from "@/components/project-location-map";
import { SiteFooter } from "@/components/site-footer";
import { LanguageToggle, T } from "@/components/language-provider";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { MapProject } from "@/lib/project-map";

export const dynamic = "force-dynamic";

const nav = [
  { href: "#projects", label: { th: "โครงการ", en: "Projects" } },
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
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-brand-primary">
            <span className="grid size-9 place-items-center rounded bg-brand-accent text-sm text-brand-primary">M</span>
            <span>
              MIDA <span className="hidden sm:inline">PROPERTY</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            <HeaderNav items={nav} />
            <a href="#projects" aria-label="ค้นหาโครงการ" className="hover:text-brand-primary">
              <i className="fa-solid fa-magnifying-glass" />
            </a>
            <LanguageToggle />
          </nav>
          <details className="group relative md:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-slate-200 text-brand-primary [&::-webkit-details-marker]:hidden">
              <i className="fa-solid fa-bars" aria-hidden="true" />
              <span className="sr-only">
                <T th="เปิดเมนู" en="Open menu" />
              </span>
            </summary>
            <nav className="absolute right-0 top-12 flex w-64 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600 shadow-xl">
              <HeaderNav items={nav} />
              {session && (
                <Link href="/admin" className="mt-1 rounded-lg bg-brand-soft px-3 py-2.5 text-brand-primary">
                  <i className="fa-solid fa-user-shield mr-2" />
                  <T th="ผู้ดูแลระบบ" en="Admin" />
                </Link>
              )}
              <div className="mt-2 px-2">
                <LanguageToggle />
              </div>
            </nav>
          </details>
        </div>
      </header>
      <HeroImageSlider
        images={heroImages}
        title={content.home_hero?.title ?? ""}
        titleEn={content.home_hero?.title_en}
        description={content.home_hero?.body ?? ""}
        descriptionEn={content.home_hero?.body_en}
      />
      <ProjectFilter projectIds={homepageProjectIds} allProjectsHref="/projects" />
      <section id="promotion" className="bg-white py-12 sm:py-16">
        <div className="container-page">
          <div className="gold-rule" />
          <h2 className="section-title">
            <T th="ข่าวสารและโปรโมชั่น" en="News & Promotions" />
          </h2>
          <NewsPromotionSlider items={updates} />
        </div>
      </section>
      <section id="location" className="bg-brand-muted py-12 sm:py-16">
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
