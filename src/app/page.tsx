import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectLocationMap } from "@/components/project-location-map";
import { LeadModal } from "@/components/lead-modal";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { prisma } from "@/lib/prisma";
import type { MapProject } from "@/lib/project-map";

export const dynamic = "force-dynamic";

const nav = [
  { href: "#projects", label: "โครงการ" },
  { href: "#promotion", label: "ข่าวสารและโปรโมชั่น" },
  { href: "#location", label: "ทำเลที่ตั้ง" },
];

const defaultUpdates: NewsPromotionItem[] = [
  {
    id: "default-promotion",
    tag: "PROMOTION",
    title: "สิทธิพิเศษสำหรับครอบครัว MIDA",
    detail: "ข้อเสนอพิเศษสำหรับลูกค้าใหม่และลูกค้า MIDA Family",
  },
  {
    id: "default-news",
    tag: "NEWS",
    title: "MIDA ร่วมมือกับ ธอส.",
    detail: "สนับสนุนการเข้าถึงที่อยู่อาศัยอย่างมั่นคง",
  },
  {
    id: "default-event",
    tag: "EVENT",
    title: "พบกันที่งาน MIDA Home Fair",
    detail: "เยี่ยมชมโครงการและรับข้อเสนอภายในงาน",
  },
];

async function homeData() {
  try {
    const [contentRows, promotions, news, projectRows] = await Promise.all([
      prisma.siteContent.findMany({ select: { id: true, content_key: true, title: true, body: true } }),
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
          location: true,
          latitude: true,
          longitude: true,
          settings: true,
        },
        orderBy: { name_th: "asc" },
      }),
    ]);
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
        detail: item.body ?? "",
        date: item.created_at,
        projectSlug: item.project?.slug,
      })),
      ...news.map((item) => ({
        id: item.id,
        entityType: "news" as const,
        tag: item.category,
        title: item.title,
        detail: item.body ?? "",
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
      content: Object.fromEntries(contentRows.map((row) => [row.content_key, { title: row.title, body: row.body }])),
      updates: updateRows.length
        ? updateRows.map((row) => ({
            id: `${row.entityType}-${row.id}`,
            tag: String(row.tag),
            title: String(row.title),
            detail: String(row.detail),
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
        location: row.location,
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        mapUrl: row.settings?.map_url ?? null,
      })),
    };
  } catch {
    return { content: {}, updates: defaultUpdates, heroImages: [], mapProjects: [] as MapProject[] };
  }
}

export default async function HomePage() {
  const { content, updates, heroImages, mapProjects } = await homeData();
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
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:border-brand-primary"
            >
              ผู้ดูแลระบบ
            </Link>
          </nav>
          <details className="group relative md:hidden">
            <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-lg border border-slate-200 text-brand-primary [&::-webkit-details-marker]:hidden">
              <i className="fa-solid fa-bars" aria-hidden="true" />
              <span className="sr-only">เปิดเมนู</span>
            </summary>
            <nav className="absolute right-0 top-12 flex w-64 flex-col gap-1 rounded-xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600 shadow-xl">
              <HeaderNav items={nav} />
              <Link href="/login" className="mt-1 rounded-lg bg-brand-soft px-3 py-2.5 text-brand-primary">
                <i className="fa-solid fa-user-shield mr-2" />
                ผู้ดูแลระบบ
              </Link>
            </nav>
          </details>
        </div>
      </header>
      <HeroImageSlider
        images={heroImages}
        title={content.home_hero?.title ?? ""}
        description={content.home_hero?.body ?? ""}
      />
      <ProjectFilter />
      <section id="promotion" className="bg-white py-12 sm:py-16">
        <div className="container-page">
          <div className="gold-rule" />
          <h2 className="section-title">ข่าวสารและโปรโมชั่น</h2>
          <NewsPromotionSlider items={updates} />
        </div>
      </section>
      <section id="location" className="bg-brand-muted py-12 sm:py-16">
        <div className="container-page">
          <div className="mb-7 max-w-2xl">
            <div className="gold-rule" />
            <p className="mt-4 text-sm font-bold tracking-widest text-brand-text">MIDA LOCATION</p>
            <h2 className="section-title mt-2">ทำเลโครงการ MIDA PROPERTY</h2>
            <p className="mt-3 leading-7 text-brand-text">
              ดูตำแหน่งโครงการทั้งหมด และกดเลือกโครงการเพื่อเปิดเส้นทางใน Google Maps
            </p>
          </div>
          <ProjectLocationMap
            projects={mapProjects}
            center={{
              name: "MIDA PROPERTY",
              address: "267 ถนนจรัญสนิทวงศ์ แขวงบางอ้อ เขตบางพลัด กรุงเทพมหานคร 10700",
              latitude: 13.8040816,
              longitude: 100.5121667,
            }}
          />
        </div>
      </section>
      <footer className="bg-brand-primary py-8 text-sm text-white/80 sm:py-9">
        <div className="container-page flex flex-col justify-between gap-3 md:flex-row">
          <p>© {new Date().getFullYear()} MIDA Agency & Development</p>
          <p>{content.contact?.body ?? "โทร 02-000-0000 · Line @midaagency"}</p>
        </div>
      </footer>
      <LeadModal />
    </main>
  );
}
