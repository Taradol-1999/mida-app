import { HomeHeader } from "@/components/home-header";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { MidaLivingShowcase } from "@/components/mida-living-showcase";
import { SiteFooter } from "@/components/site-footer";
import { T } from "@/components/language-provider";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
    const [contentRows, promotions, news] = await Promise.all([
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
      homepageProjectIds: homepageRows?.map((row) => row.project_id),
    };
  } catch {
    return {
      content: {},
      updates: defaultUpdates,
      heroImages: [],
      homepageProjectIds: undefined as string[] | undefined,
    };
  }
}

export default async function HomePage() {
  const [{ content, updates, heroImages, homepageProjectIds }, session] = await Promise.all([homeData(), getSession()]);
  return (
    <main>
      <HomeHeader showAdmin={Boolean(session)} />
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
      <section id="promotion" className="relative overflow-hidden bg-[#003f7d] py-14 text-white sm:py-18 lg:py-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_22%_15%,rgba(0,111,181,.48),transparent_35%),linear-gradient(120deg,#003b73,#004d91_62%,#003668)]" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex h-36 items-end justify-around overflow-hidden text-[7rem] leading-none text-[#0780c4]/12 sm:h-48 sm:text-[11rem]"
          aria-hidden="true"
        >
          <i className="fa-solid fa-building" />
          <i className="fa-solid fa-city" />
          <i className="fa-solid fa-building-columns" />
          <i className="fa-solid fa-hotel" />
          <i className="fa-solid fa-building" />
        </div>
        <div className="container-page relative grid items-center gap-10 lg:grid-cols-[minmax(250px,0.34fr)_minmax(0,0.66fr)] lg:gap-16">
          <div className="max-w-lg lg:pb-8">
            <h2 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              <T th="Blog เรื่องราวที่น่าสนใจ" en="Blog — Stories worth exploring" />
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-blue-100">
              <T
                th="รวบรวมทุกบทความ ข่าวสาร ไลฟ์สไตล์ของธุรกิจเครือไมด้า"
                en="Articles, news, and lifestyle stories from the MIDA group."
              />
            </p>
            <a
              href="#promotion-news"
              className="mt-6 inline-flex min-h-11 items-center gap-4 rounded-full bg-brand-accent py-1.5 pr-1.5 pl-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-primary"
            >
              <T th="คลิกดูบทความทั้งหมด" en="Explore all stories" />
              <span className="grid size-9 place-items-center rounded-full bg-white text-brand-primary">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </a>
          </div>
          <div id="promotion-news" className="min-w-0">
            <NewsPromotionSlider items={updates} variant="home" />
          </div>
        </div>
      </section>
      <SiteFooter contact={content.contact?.body} contactEn={content.contact?.body_en} />
    </main>
  );
}
