import Link from "next/link";
import { MidaPageLayout } from "@/components/mida-page-layout";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { MidaLivingShowcase, type MidaLivingItem } from "@/components/mida-living-showcase";
import { T } from "@/components/language-provider";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { prisma } from "@/lib/prisma";
import backgroundImageFile from "@/assets/background/city-2.jpg";

export const dynamic = "force-dynamic";

async function homeData() {
  try {
    const [contentRows, blogRows, livingRows] = await Promise.all([
      prisma.siteContent.findMany({
        select: { id: true, content_key: true, title: true, title_en: true, body: true, body_en: true },
      }),
      prisma.midaBlogItem
        .findMany({
          where: { is_active: true },
          orderBy: { created_at: "desc" },
          take: 12,
        })
        .catch(() => []),
      prisma.midaLivingItem.findMany({
        where: { is_active: true },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
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
    const updateMedia = await prisma.mediaAsset.findMany({
      where: {
        media_kind: { in: ["cover", "gallery"] },
        entity_type: "mida-blog",
        entity_id: { in: blogRows.map((row) => row.id) },
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    const livingMedia = await prisma.mediaAsset.findMany({
      where: {
        entity_type: "mida-living",
        entity_id: { in: livingRows.map((row) => row.id) },
        media_kind: "portrait",
      },
      orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
    });
    const livingImageById = new Map<string, (typeof livingMedia)[number]>();
    for (const image of livingMedia)
      if (!livingImageById.has(image.entity_id)) livingImageById.set(image.entity_id, image);
    const mediaByItem = new Map<string, typeof updateMedia>();
    for (const item of updateMedia) {
      const key = `${item.entity_type}:${item.entity_id}`;
      const existing = mediaByItem.get(key) ?? [];
      mediaByItem.set(key, item.media_kind === "cover" ? [item, ...existing] : [...existing, item]);
    }
    return {
      content: Object.fromEntries(
        contentRows.map((row) => [
          row.content_key,
          { title: row.title, title_en: row.title_en, body: row.body, body_en: row.body_en },
        ]),
      ),
      updates: blogRows.map((row): NewsPromotionItem => ({
        id: row.id,
        tag: "BLOG",
        title: row.name_th,
        titleEn: row.name_en,
        detail: row.description_th ?? "",
        detailEn: row.description_en,
        href: `/blog/${row.id}`,
        images: (mediaByItem.get(`mida-blog:${row.id}`) ?? []).map((media) => ({
          src: `/api/admin/media?entityType=mida-blog&entityId=${row.id}&mediaKind=${media.media_kind}&mediaId=${media.id}`,
          alt: String(media.original_name || row.name_th),
          type: String(media.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
        })),
      })),
      heroImages: heroImageRows.map((row) => ({
        src: `/api/admin/media?entityType=site-content&entityId=${homeHero?.id}&mediaKind=hero&mediaId=${row.id}`,
        alt: String(row.original_name || "แบนเนอร์ MIDA Property"),
        type: String(row.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
      })),
      homepageProjectIds: homepageRows?.map((row) => row.project_id),
      livingItems: livingRows.map((row): MidaLivingItem => {
        const image = livingImageById.get(row.id);
        return {
          id: row.id,
          nameTh: row.name_th,
          nameEn: row.name_en,
          descriptionTh: row.description_th,
          descriptionEn: row.description_en,
          websiteUrl: row.website_url,
          imageUrl: image
            ? `/api/admin/media?entityType=mida-living&entityId=${row.id}&mediaKind=portrait&mediaId=${image.id}`
            : null,
        };
      }),
    };
  } catch {
    return {
      content: {},
      updates: [] as NewsPromotionItem[],
      heroImages: [],
      homepageProjectIds: undefined as string[] | undefined,
      livingItems: [] as MidaLivingItem[],
    };
  }
}

export default async function HomePage() {
  const { content, updates, heroImages, homepageProjectIds, livingItems } = await homeData();
  return (
    <MidaPageLayout showLiving={livingItems.length > 0}>
      <HeroImageSlider
        variant="home"
        images={heroImages}
        title={content.home_hero?.title ?? ""}
        titleEn={content.home_hero?.title_en}
        description={content.home_hero?.body ?? ""}
        descriptionEn={content.home_hero?.body_en}
      />
      <div className="bg-page-sky">
        <ProjectFilter projectIds={homepageProjectIds} allProjectsHref="/projects" />
        <MidaLivingShowcase items={livingItems} />
      </div>
      <section
        id="promotion"
        className="relative overflow-hidden bg-banner-blue py-14 text-white sm:py-18 lg:py-20 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImageFile.src})` }}
      >
        {/* เลเยอร์ Overlay ปรับจางลง (Opacity 40-60%) เพื่อให้เห็นรูปพื้นหลังชัดขึ้น */}
        <div className="pointer-events-none absolute inset-0 bg-banner-blue/60 background-city-overlay" />

        <div className="container-page relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(250px,0.34fr)_minmax(0,0.66fr)] lg:gap-16">
          <div className="max-w-lg lg:pb-8">
            <h2 className="text-2xl font-extrabold leading-snug sm:text-4xl sm:leading-tight">
              <T th="Blog เรื่องราวที่น่าสนใจ" en="Blog — Stories worth exploring" />
            </h2>
            <p className="mt-3 max-w-md text-sm leading-7 text-blue-100">
              <T
                th="รวบรวมทุกบทความ ข่าวสาร ไลฟ์สไตล์ของธุรกิจเครือไมด้า"
                en="Articles, news, and lifestyle stories from the MIDA group."
              />
            </p>
            <Link
              href="/blog"
              className="mt-6 inline-flex min-h-11 items-center gap-4 rounded-full bg-brand-accent py-1.5 pr-1.5 pl-5 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-white hover:text-brand-primary"
            >
              <T th="คลิกดูบทความทั้งหมด" en="Explore all stories" />
              <span className="grid size-9 place-items-center rounded-full bg-white text-brand-primary">
                <i className="fa-solid fa-arrow-right" aria-hidden="true" />
              </span>
            </Link>
          </div>
          <div id="promotion-news" className="min-w-0">
            <NewsPromotionSlider items={updates} variant="home" />
          </div>
        </div>
      </section>
    </MidaPageLayout>
  );
}
