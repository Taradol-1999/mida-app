import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import { notFound } from "next/navigation";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectLocationMap } from "@/components/project-location-map";
import { HouseTypeCarousel, type HouseTypeItem } from "@/components/house-type-carousel";
import { LeadModal } from "@/components/lead-modal";
import { LeadOpenButton } from "@/components/lead-open-button";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectGallery, type ProjectGalleryItem } from "@/components/project-gallery";
import { findProject } from "@/data/projects";
import { prisma } from "@/lib/prisma";
import { directionsUrl, type MapProject } from "@/lib/project-map";

export const dynamic = "force-dynamic";
const emptySettings = {
  hero_title_th: null,
  hero_subtitle_th: null,
  phone: null,
  email: null,
  map_url: null,
  virtual_tour_url: null,
  nearby_places_th: null,
  care_warranty: null,
  care_maintenance: null,
  care_common_area: null,
};
const projectType = (value: string) =>
  value === "TOWNHOME"
    ? "ทาวน์โฮม"
    : value === "SEMI_DETACHED"
      ? "บ้านแฝด"
      : value === "COMMERCIAL"
        ? "อาคารพาณิชย์"
        : "บ้านเดี่ยว";

async function getProject(slug: string) {
  const fallback = findProject(slug);
  const fallbackData = fallback && {
    ...fallback,
    id: null,
    coverUrl: null,
    houseTypes: [] as Array<Record<string, unknown>>,
    promotions: [] as Array<Record<string, unknown>>,
    news: [] as Array<Record<string, unknown>>,
    heroMedia: [] as ProjectGalleryItem[],
    galleryMedia: [] as ProjectGalleryItem[],
    brochureUrl: null as string | null,
    settings: emptySettings,
  };
  try {
    const row = await prisma.project.findFirst({
      where: { slug, status: { not: "ARCHIVED" } },
      include: {
        facilities: { orderBy: { sort_order: "asc" } },
        house_types: { orderBy: { starting_price: "asc" } },
        promotions: { where: { is_published: true }, orderBy: { created_at: "desc" } },
        news_items: { where: { is_published: true }, orderBy: { published_at: "desc" } },
        settings: true,
      },
    });
    if (!row) return fallbackData;
    const [mediaRows, houseMedia] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: { entity_type: "projects", entity_id: row.id, media_kind: { in: ["cover", "hero", "brochure"] } },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      }),
      prisma.mediaAsset.findMany({
        where: {
          entity_type: "house-types",
          entity_id: { in: row.house_types.map((house) => house.id) },
          media_kind: "cover",
        },
        orderBy: { created_at: "asc" },
      }),
    ]);
    const houseImages = new Map(houseMedia.map((item) => [item.entity_id, item.id]));
    const houseTypeRows = row.house_types.map((house) => ({ ...house, image_id: houseImages.get(house.id) ?? null }));
    const media = mediaRows.map((item) => ({
      src: `/api/admin/media?entityType=projects&entityId=${row.id}&mediaKind=${item.media_kind}&mediaId=${item.id}`,
      alt: String(item.original_name || `ภาพโครงการ ${row.name_th}`),
      type: String(item.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
    }));
    const heroMedia = media.filter((_, index) => mediaRows[index].media_kind === "hero");
    const cover = media.find((_, index) => mediaRows[index].media_kind === "cover");
    const brochure = media.find((_, index) => mediaRows[index].media_kind === "brochure");
    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name_th,
      location: row.location,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      type: projectType(row.property_type),
      price: `${(Number(row.starting_price) / 1000000).toLocaleString("th-TH", { maximumFractionDigits: 3 })} ล้านบาท*`,
      status: row.status === "READY" ? "พร้อมอยู่" : "กำลังก่อสร้าง",
      label: "MIDA PROPERTY",
      description: row.description ?? "",
      facilities: row.facilities.map((facility) => facility.name),
      landmarks: fallback?.landmarks ?? ["โปรดเพิ่มสถานที่ใกล้เคียงจากหลังบ้าน"],
      houseTypes: houseTypeRows,
      promotions: row.promotions,
      news: row.news_items,
      settings: { ...emptySettings, ...(row.settings ?? {}) },
      coverUrl: cover?.src ?? null,
      heroMedia: heroMedia.length ? heroMedia : cover ? [cover] : [],
      galleryMedia: media.filter((_, index) => mediaRows[index].media_kind !== "brochure"),
      brochureUrl: brochure?.src ?? null,
    };
  } catch {
    return fallbackData;
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) notFound();
  const heroTitle = project.settings.hero_title_th || project.name;
  const heroDescription = project.settings.hero_subtitle_th || project.description;
  const landmarks = project.settings.nearby_places_th
    ? String(project.settings.nearby_places_th)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : project.landmarks;
  const projectUpdates: NewsPromotionItem[] = [
    ...project.promotions.map(
      (promotion) => ["PROMOTION", String(promotion.title), String(promotion.body ?? "")] as NewsPromotionItem,
    ),
    ...project.news.map((item) => ["NEWS / EVENT", String(item.title), String(item.body ?? "")] as NewsPromotionItem),
  ];
  const houseTypeItems: HouseTypeItem[] = project.houseTypes.map((house) => ({
    id: String(house.id),
    name: String(house.name),
    description: String(house.description ?? ""),
    bedrooms: String(house.bedrooms ?? "-"),
    bathrooms: String(house.bathrooms ?? "-"),
    usableArea: String(house.usable_area_sqm ?? "-"),
    startingPrice: house.starting_price === null ? null : Number(house.starting_price),
    imageUrl: house.image_id
      ? `/api/admin/media?entityType=house-types&entityId=${house.id}&mediaKind=cover&mediaId=${house.image_id}`
      : null,
  }));
  const mapProject: MapProject = {
    id: project.id ?? undefined,
    slug: project.slug,
    name: project.name,
    location: project.location,
    latitude: project.latitude ?? null,
    longitude: project.longitude ?? null,
    mapUrl: project.settings.map_url,
  };
  return (
    <main className="bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="project-container flex min-h-18 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label={`กลับหน้าหลัก MIDA จากโครงการ ${project.name}`}
            className="flex min-w-0 items-center gap-2 font-extrabold text-brand-primary"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-accent text-xs text-brand-primary">
              {String(project.name).charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm sm:text-base">{project.name}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-semibold text-slate-600 lg:flex">
            <HeaderNav
              items={[
                { href: "#house-types", label: "แบบบ้าน" },
                { href: "#facilities", label: "ส่วนกลาง" },
                { href: "#project-promo-news", label: "Promotion" },
                { href: "#mida-care", label: "บริการหลังการขาย" },
              ]}
            />
          </nav>
          <LeadOpenButton className="rounded-lg bg-brand-primary px-3 py-2 text-xs font-bold text-white">
            นัดชมโครงการ
          </LeadOpenButton>
        </div>
      </header>
      <HeroImageSlider
        images={project.heroMedia}
        title={heroTitle}
        description={heroDescription}
        meta={`ราคาเริ่มต้น ${project.price}`}
        actionHref={project.brochureUrl}
        actionLabel="โหลดโบรชัวร์โครงการ"
      />
      <section id="overview" className="project-container py-14 md:py-16">
        <ProjectGallery items={project.galleryMedia} />
      </section>
      {project.houseTypes.length > 0 && (
        <section id="house-types" className="bg-white py-16">
          <div className="project-container">
            <div className="gold-rule mb-3" />
            <h2 className="section-title">รูปแบบบ้านและราคาเริ่มต้น (House Types)</h2>
            <HouseTypeCarousel items={houseTypeItems} />
          </div>
        </section>
      )}
      {project.facilities.length > 0 && (
        <section id="facilities" className="bg-brand-primary py-14 text-white md:py-16">
          <div className="project-container">
            <div>
              <span className="mb-3 block h-1 w-14 rounded-full bg-brand-accent" />
              <h2 className="text-2xl font-extrabold md:text-3xl">สิ่งอำนวยความสะดวกในโครงการ</h2>
              <p className="max-w-lg text-sm leading-6 text-blue-100">
                พื้นที่และบริการที่ออกแบบมาเพื่อเติมเต็มทุกช่วงเวลาของการอยู่อาศัย
              </p>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {project.facilities.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 text-sm font-semibold backdrop-blur-sm"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-brand-primary">
                    <i className="fa-solid fa-check" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      {projectUpdates.length > 0 && (
        <section id="project-promo-news" className="bg-brand-muted py-16">
          <div className="project-container">
            <h2 className="text-2xl font-bold text-brand-primary md:text-3xl">
              <i className="fa-solid fa-fire mr-2" />
              โปรโมชั่น ข่าวสาร & กิจกรรมพิเศษ
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              อัปเดตข้อเสนอ ข่าวสาร และกิจกรรมล่าสุดสำหรับโครงการนี้
            </p>
            <NewsPromotionSlider items={projectUpdates} variant="project" />
          </div>
        </section>
      )}
      <section id="map" className="bg-white py-16">
        <div className="project-container">
          <h2 className="section-title">แผนที่และสถานที่ใกล้เคียง</h2>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <ProjectLocationMap projects={[mapProject]} />
            <aside className="rounded-2xl bg-brand-muted p-6">
              <h3 className="font-extrabold text-brand-primary">สถานที่ใกล้เคียง</h3>
              <a
                href={project.settings.map_url || directionsUrl(mapProject)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-brand-text"
              >
                <i className="fa-solid fa-diamond-turn-right" />
                นำทางไปโครงการ
              </a>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {landmarks.map((landmark) => (
                  <li key={landmark} className="border-b border-slate-200 pb-3">
                    {landmark}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
          {project.settings.virtual_tour_url && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-brand-muted p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="font-extrabold text-brand-primary">Map 3D / Virtual Tour</h3>
                <a
                  href={String(project.settings.virtual_tour_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white"
                >
                  เปิดเต็มหน้าจอ
                </a>
              </div>
              <iframe
                src={String(project.settings.virtual_tour_url)}
                title={`Virtual Tour ${project.name}`}
                className="h-[28rem] w-full rounded-xl bg-white"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </section>
      <section id="mida-care" className="bg-brand-muted py-16">
        <div className="project-container">
          <div className="text-center">
            <p className="text-sm font-bold tracking-widest text-brand-text">MIDA CARE</p>
            <h2 className="section-title mt-2">บริการหลังการขาย</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              ["การรับประกันหลังขาย", project.settings.care_warranty, "fa-shield-heart"],
              ["คู่มือการอยู่อาศัย", project.settings.care_maintenance, "fa-book-open"],
              ["นิติบุคคล & พื้นที่ส่วนกลาง", project.settings.care_common_area, "fa-people-roof"],
            ].map(([title, detail, icon]) => (
              <details
                open
                key={String(title)}
                className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <summary className="flex cursor-pointer list-none items-center gap-3 font-bold text-brand-primary">
                  <span className="grid size-10 place-items-center rounded-full bg-blue-50">
                    <i className={`fa-solid ${icon}`} />
                  </span>
                  <span className="flex-1">{title}</span>
                  <i className="fa-solid fa-chevron-down text-xs transition group-open:rotate-180" />
                </summary>
                <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-7 text-brand-text">
                  {detail || "สอบถามรายละเอียดบริการได้จากเจ้าหน้าที่โครงการ"}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <section id="register" className="project-container py-16 text-center">
        <h2 className="section-title">รับข้อเสนอพิเศษ</h2>
        <p className="mt-3 text-slate-500">ลงทะเบียนเพื่อรับข้อมูลโครงการและนัดหมายเข้าชม</p>
        <LeadOpenButton className="mt-6 rounded-full bg-brand-primary px-8 py-3 text-sm font-bold text-white shadow-lg hover:bg-brand-text">
          ลงทะเบียนรับข้อเสนอพิเศษ
        </LeadOpenButton>
        {project.settings.phone && <p className="mt-3 font-bold text-brand-primary">โทร {project.settings.phone}</p>}
        {project.settings.email && <p className="mt-1 text-sm text-slate-500">{project.settings.email}</p>}
        <p className="mt-3 text-xs text-slate-400">
          * ราคาและรายละเอียดเป็นข้อมูลจำลอง โปรดตรวจสอบกับฝ่ายขายก่อนตัดสินใจ
        </p>
      </section>
      <LeadModal projectId={project.id} projectName={project.name} />
    </main>
  );
}
