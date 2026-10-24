import { notFound } from "next/navigation";
import { ProjectMapTabs } from "@/components/project-map-tabs";
import { projectLocationKey, projectLocationSchema } from "@/lib/project-location";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectSectionTracker } from "@/components/project-section-tracker";
import { HouseTypeCarousel, type HouseTypeItem } from "@/components/house-type-carousel";
import { LeadRegistrationForm } from "@/components/lead-registration-form";
import { Input, Select } from "@/components/ui/form-controls";
import { leadAgeRanges, leadOccupations, occupationEnglish } from "@/lib/lead-options";
import { T } from "@/components/language-provider";
import { HomeHeader } from "@/components/home-header";
import { FloatingContactWidget } from "@/components/floating-contact-widget";
import { projectContactKey } from "@/lib/project-contact";
import { type NewsPromotionImage, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { type ProjectGalleryItem } from "@/components/project-gallery";
import { ProjectNearbyShowcase } from "@/components/project-nearby-showcase";
import { projectShowcaseSchema, showcaseKey } from "@/lib/project-showcase";
import { findProject } from "@/data/projects";
import { prisma } from "@/lib/prisma";
import { directionsUrl, googleMapsEmbedUrl, type MapProject } from "@/lib/project-map";
import { FacilityCategory, ProjectFacilitiesShowcase } from "@/components/project-facilities-showcase";
import backgroundImageFile from "@/assets/background/city-3.jpg";

export const dynamic = "force-dynamic";
const emptySettings = {
  hero_title_th: null,
  hero_title_en: null,
  hero_subtitle_th: null,
  hero_subtitle_en: null,
  phone: null,
  email: null,
  facebook_url: null,
  line_url: null,
  map_url: null,
  virtual_tour_url: null,
  nearby_places_th: null,
  nearby_places_en: null,
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
function updateImages(value: unknown): NewsPromotionImage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is NewsPromotionImage =>
      Boolean(item) &&
      typeof item === "object" &&
      "src" in item &&
      typeof item.src === "string" &&
      "alt" in item &&
      typeof item.alt === "string" &&
      "type" in item &&
      (item.type === "image" || item.type === "video"),
  );
}

async function getProject(slug: string) {
  const fallback = findProject(slug);
  const fallbackData = fallback && {
    ...fallback,
    id: null,
    province: fallback.province ?? null,
    district: fallback.district ?? null,
    subdistrict: fallback.subdistrict ?? null,
    coverUrl: null,
    logoUrl: null as string | null,
    houseTypes: [] as Array<Record<string, unknown>>,
    promotions: [] as Array<Record<string, unknown>>,
    news: [] as Array<Record<string, unknown>>,
    heroMedia: [] as ProjectGalleryItem[],
    galleryMedia: [] as ProjectGalleryItem[],
    nearbyMedia: [] as ProjectGalleryItem[],
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
    const [mediaRows, houseMedia, updateMedia] = await Promise.all([
      prisma.mediaAsset.findMany({
        where: {
          entity_type: "projects",
          entity_id: row.id,
          media_kind: { in: ["cover", "hero", "brochure", "nearby", "logo"] },
        },
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
      prisma.mediaAsset.findMany({
        where: {
          media_kind: "gallery",
          OR: [
            { entity_type: "promotions", entity_id: { in: row.promotions.map((item) => item.id) } },
            { entity_type: "news", entity_id: { in: row.news_items.map((item) => item.id) } },
          ],
        },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
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
    const nearbyMedia = media.filter((_, index) => mediaRows[index].media_kind === "nearby");
    const cover = media.find((_, index) => mediaRows[index].media_kind === "cover");
    const brochure = media.find((_, index) => mediaRows[index].media_kind === "brochure");
    const contentMediaByItem = new Map<string, typeof updateMedia>();
    for (const item of updateMedia) {
      const key = `${item.entity_type}:${item.entity_id}`;
      contentMediaByItem.set(key, [...(contentMediaByItem.get(key) ?? []), item]);
    }
    const contentImages = (entityType: "promotions" | "news", entityId: string, title: string) =>
      (contentMediaByItem.get(`${entityType}:${entityId}`) ?? []).map((item) => ({
        src: `/api/admin/media?entityType=${entityType}&entityId=${entityId}&mediaKind=gallery&mediaId=${item.id}`,
        alt: String(item.original_name || title),
        type: String(item.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
      }));
    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name_th,
      name_en: row.name_en,
      location: row.location,
      location_en: row.location_en,
      province: row.province,
      district: row.district,
      subdistrict: row.subdistrict,
      latitude: row.latitude === null ? null : Number(row.latitude),
      longitude: row.longitude === null ? null : Number(row.longitude),
      type: projectType(row.property_type),
      price: `${(Number(row.starting_price) / 1000000).toLocaleString("th-TH", { maximumFractionDigits: 3 })} ล้านบาท`,
      status: row.status === "READY" ? "พร้อมอยู่" : "กำลังก่อสร้าง",
      label: "MIDA PROPERTY",
      description: row.description ?? "",
      description_en: row.description_en,
      facilities: row.facilities.map((facility) => ({ th: facility.name, en: facility.name_en ?? "" })),
      landmarks: fallback?.landmarks ?? ["โปรดเพิ่มสถานที่ใกล้เคียงจากหลังบ้าน"],
      houseTypes: houseTypeRows,
      promotions: row.promotions.map((item) => ({ ...item, images: contentImages("promotions", item.id, item.title) })),
      news: row.news_items.map((item) => ({ ...item, images: contentImages("news", item.id, item.title) })),
      settings: { ...emptySettings, ...(row.settings ?? {}) },
      coverUrl: cover?.src ?? null,
      logoUrl: media.find((_, index) => mediaRows[index].media_kind === "logo")?.src ?? null,
      heroMedia: heroMedia.length ? heroMedia : cover ? [cover] : [],
      galleryMedia: media.filter((_, index) => !["brochure", "logo"].includes(mediaRows[index].media_kind)),
      nearbyMedia,
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
  const contactContent = project.id
    ? await prisma.siteContent.findUnique({ where: { content_key: projectContactKey(project.id) } })
    : null;
  const safeContactUrl = (value?: string | null) => {
    try {
      const url = new URL(value ?? "");
      return url.protocol === "https:" ? url.href : undefined;
    } catch {
      return undefined;
    }
  };
  const facilityRows = project.id
    ? await prisma.facility.findMany({ where: { project_id: project.id }, orderBy: { sort_order: "asc" } })
    : [];
  const facilityMedia = facilityRows.length
    ? await prisma.mediaAsset.findMany({
        where: {
          entity_type: "facilities",
          entity_id: { in: facilityRows.map((item) => item.id) },
          media_kind: "gallery",
        },
        orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
      })
    : [];
  const facilities: FacilityCategory[] = facilityRows.map((facility) => ({
    id: facility.id,
    name: facility.name,
    nameEn: facility.name_en ?? undefined,
    description: facility.description ?? undefined,
    descriptionEn: facility.description_en ?? undefined,
    images: facilityMedia
      .filter((image) => image.entity_id === facility.id)
      .map((image) => ({
        id: image.id,
        url: `/api/admin/media?entityType=facilities&entityId=${facility.id}&mediaKind=gallery&mediaId=${image.id}`,
        alt: facility.name,
      })),
  }));
  const showcaseRow = project.id
    ? await prisma.siteContent.findUnique({ where: { content_key: showcaseKey(project.id) } }).catch(() => null)
    : null;
  const showcase = (() => {
    try {
      return projectShowcaseSchema.safeParse(JSON.parse(showcaseRow?.body || "null")).data;
    } catch {
      return undefined;
    }
  })();
  const heroTitle = project.settings.hero_title_th || project.name;
  const locationRow = project.id
    ? await prisma.siteContent.findUnique({ where: { content_key: projectLocationKey(project.id) } })
    : null;
  const locationSettings = (() => {
    try {
      return projectLocationSchema.safeParse(JSON.parse(locationRow?.body || "null")).data;
    } catch {
      return undefined;
    }
  })();
  const heroTitleEn = project.settings.hero_title_en || project.name_en;
  const heroDescription = project.settings.hero_subtitle_th || project.description;
  const heroDescriptionEn = project.settings.hero_subtitle_en || project.description_en;
  const landmarks = project.settings.nearby_places_th
    ? String(project.settings.nearby_places_th)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : project.landmarks;
  const landmarksEn = project.settings.nearby_places_en
    ? String(project.settings.nearby_places_en)
        .split("\n")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];
  const projectUpdates: NewsPromotionItem[] = [
    ...project.promotions.map((promotion) => ({
      id: `promotion-${String(promotion.id)}`,
      tag: "PROMOTION",
      title: String(promotion.title),
      titleEn: typeof promotion.title_en === "string" ? promotion.title_en : null,
      detail: String(promotion.body ?? ""),
      detailEn: typeof promotion.body_en === "string" ? promotion.body_en : null,
      images: updateImages(promotion.images),
    })),
    ...project.news.map((item) => ({
      id: `news-${String(item.id)}`,
      tag: "NEWS / EVENT",
      title: String(item.title),
      titleEn: typeof item.title_en === "string" ? item.title_en : null,
      detail: String(item.body ?? ""),
      detailEn: typeof item.body_en === "string" ? item.body_en : null,
      images: updateImages(item.images),
    })),
  ];
  const houseTypeItems: HouseTypeItem[] = project.houseTypes.map((house) => ({
    id: String(house.id),
    name: String(house.name),
    nameEn: typeof house.name_en === "string" ? house.name_en : null,
    description: String(house.description ?? ""),
    descriptionEn: typeof house.description_en === "string" ? house.description_en : null,
    bedrooms: String(house.bedrooms ?? "-"),
    bathrooms: String(house.bathrooms ?? "-"),
    usableArea: String(house.usable_area_sqm ?? "-"),
    startingPrice: house.starting_price === null ? null : Number(house.starting_price),
    imageUrl: house.image_id
      ? `/api/admin/media?entityType=house-types&entityId=${house.id}&mediaKind=cover&mediaId=${house.image_id}`
      : null,
  }));
  const projectAddress = [project.province, project.district, project.subdistrict].filter((value): value is string =>
    Boolean(value),
  );
  const projectAddressText = projectAddress.join(" · ");
  const mapProject: MapProject = {
    id: project.id ?? undefined,
    slug: project.slug,
    name: project.name,
    nameEn: project.name_en,
    location: projectAddressText || project.location,
    locationEn: project.location_en,
    latitude: locationSettings?.latitude ?? project.latitude ?? null,
    longitude: locationSettings?.longitude ?? project.longitude ?? null,
    mapUrl: locationSettings ? locationSettings.mapUrl : project.settings.map_url,
  };
  const careItems = [
    {
      title: { th: "การรับประกันหลังขาย", en: "After-sales Warranty" },
      detail: project.settings.care_warranty,
      icon: "fa-shield-heart",
    },
    {
      title: { th: "คู่มือการอยู่อาศัย", en: "Living Guide" },
      detail: project.settings.care_maintenance,
      icon: "fa-book-open",
    },
    {
      title: { th: "นิติบุคคล & พื้นที่ส่วนกลาง", en: "Juristic Office & Common Areas" },
      detail: project.settings.care_common_area,
      icon: "fa-people-roof",
    },
  ];
  const projectNavigation = [
    { href: "#project-top", label: { th: "ภาพรวมโครงการ", en: "Overview" } },
    ...(project.houseTypes.length > 0 ? [{ href: "#house-types", label: { th: "แบบบ้าน", en: "House Types" } }] : []),
    ...(project.facilities.length > 0 ? [{ href: "#facilities", label: { th: "ส่วนกลาง", en: "Facilities" } }] : []),
    ...(projectUpdates.length > 0
      ? [{ href: "#project-promo-news", label: { th: "โปรโมชั่น", en: "Promotions" } }]
      : []),
    { href: "#map", label: { th: "ทำเลที่ตั้ง", en: "Location" } },
    { href: "#mida-care", label: { th: "บริการหลังการขาย", en: "After-sales" } },
  ];
  return (
    <main id="project-top" className="bg-white">
      <HomeHeader
        logoUrl={project.logoUrl}
        logoLabel={{ th: project.name, en: project.name_en ?? "" }}
        showAdmin={false}
        items={projectNavigation}
        menuLabel={{ th: "เมนูโครงการ", en: "Project menu" }}
        searchHref="/#projects"
      />
      <ProjectSectionTracker sectionIds={projectNavigation.map((item) => item.href.slice(1))} />
      <HeroImageSlider
        images={project.heroMedia}
        title={heroTitle}
        titleEn={heroTitleEn}
        description={heroDescription}
        descriptionEn={heroDescriptionEn}
        meta={`ราคาเริ่มต้น ${project.price}`}
        metaEn={`Starting from THB ${(Number(project.price.replace(/[^0-9.]/g, "")) || 0).toLocaleString("en-US")} million`}
        actionHref={project.brochureUrl}
        actionLabel="โหลดโบรชัวร์โครงการ"
        actionLabelEn="Download project brochure"
        ariaLabelTh={`สไลด์รูปภาพโครงการ ${project.name}`}
        ariaLabelEn={`Image slider for ${project.name_en || project.name}`}
      />
      {showcase && showcase.items.length > 0 && (
        <ProjectNearbyShowcase
          title={showcase.title}
          titleEn={showcase.titleEn}
          description={showcase.description}
          descriptionEn={showcase.descriptionEn}
          places={showcase.items.map((item) => ({
            th: item.name,
            en: item.nameEn,
            description: item.description,
            descriptionEn: item.descriptionEn,
          }))}
          media={showcase.items.map((item) => ({
            src: `/api/admin/media?entityType=projects&entityId=${project.id}&mediaKind=nearby&mediaId=${item.mediaId}`,
            alt: item.name,
            type: "image" as const,
          }))}
          location={projectAddressText || project.location}
        />
      )}
      {project.houseTypes.length > 0 && (
        <section id="house-types" className="overflow-hidden bg-brand-muted pt-12 sm:pt-16 md:pt-20">
          <div className="project-container relative z-10">
            <div className="gold-rule mb-3" />
            <h2 className="section-title">
              <T th="รูปแบบบ้านและราคาเริ่มต้น (House Types)" en="House Types & Starting Prices" />
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              <T
                th="สำรวจพื้นที่ใช้สอย ฟังก์ชัน และราคาเริ่มต้นของแบบบ้านในโครงการนี้"
                en="Explore layouts, features, and starting prices for every home type in this project."
              />
            </p>
            <HouseTypeCarousel items={houseTypeItems} />
          </div>
        </section>
      )}
      <div className="bg">
        <ProjectFacilitiesShowcase
          facilities={facilities}
          title="สิ่งอำนวยความสะดวก"
          description="Enjoy your Space เพราะความสุขมีได้ไม่รู้จบ"
        />
      </div>
      <section id="map" className="border-y border-slate-100 bg-white py-12 sm:py-16 md:py-20">
        <div className="project-container">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="gold-rule mb-3" />
              <h2 className="section-title">
                <T th="แผนที่และสถานที่ใกล้เคียง" en="Map & Nearby Places" />
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-slate-500">
              <T
                th="ค้นพบความสะดวกสบายรอบโครงการ และวางแผนการเดินทางได้ทันที"
                en="Discover nearby conveniences and plan your journey with ease."
              />
            </p>
          </div>
          <ProjectMapTabs
            imageUrl={
              locationSettings?.imageId
                ? `/api/admin/media?entityType=projects&entityId=${project.id}&mediaKind=map-image&mediaId=${locationSettings.imageId}`
                : undefined
            }
            embedUrl={googleMapsEmbedUrl(mapProject)}
            directionsHref={mapProject.mapUrl || directionsUrl(mapProject)}
            projectName={project.name}
          />
          <div className="mt-6 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
            <aside
              style={{ backgroundImage: `url(${backgroundImageFile.src})` }}
              className="bg-cover bg-center bg-no-repeat relative overflow-hidden rounded-3xl bg-brand-primary p-5 text-white shadow-project-panel sm:p-6"
            >
              <div className="pointer-events-none absolute inset-0 bg-banner-blue/85 background-city-overlay" />
              <div className="relative">
                <span className="grid size-11 place-items-center rounded-2xl bg-brand-accent text-lg text-brand-primary shadow-sm">
                  <i className="fa-solid fa-location-dot" />
                </span>
                <p className="mt-4 text-[10px] font-extrabold tracking-[0.15em] text-brand-accent">
                  <T th="ที่อยู่โครงการ" en="PROJECT ADDRESS" />
                </p>
                <p className="mt-2 text-base font-extrabold leading-7 sm:text-lg">
                  {projectAddressText || project.location}
                </p>
                <a
                  href={mapProject.mapUrl || directionsUrl(mapProject)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-brand-primary transition hover:bg-brand-accent"
                >
                  <i className="fa-solid fa-diamond-turn-right" />
                  <T th="นำทางไปโครงการ" en="Get directions" />
                </a>
              </div>
            </aside>
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-brand-accent-soft text-brand-primary">
                  <i className="fa-solid fa-map-pin" />
                </span>
                <div>
                  <p className="text-[10px] font-extrabold tracking-[0.13em] text-brand-accent">
                    <T th={project.name} en={project.name_en ?? ""} />
                  </p>
                  <h3 className="mt-0.5 font-extrabold text-brand-primary">
                    <T th="สถานที่ใกล้เคียง" en="Nearby Places" />
                  </h3>
                </div>
              </div>
              <ul className="mt-5 grid gap-x-6 sm:grid-cols-2">
                {(locationSettings
                  ? locationSettings.places
                  : landmarks.map((name, index) => ({
                      name,
                      nameEn: landmarksEn[index],
                      url: "",
                      icon: "fa-location-dot",
                    }))
                ).map((place, index) => (
                  <li
                    key={`${place.name}-${index}`}
                    className="flex min-w-0 items-center gap-3 border-b border-slate-100 py-3 last:border-0"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-soft text-[0.65rem] font-extrabold text-brand-primary">
                      <i className={`fa-solid ${place.icon ?? "fa-location-dot"}`} aria-hidden="true" />
                    </span>
                    {place.url ? (
                      <a
                        href={place.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 text-sm font-medium text-brand-primary hover:underline"
                      >
                        <T th={place.name} en={place.nameEn ?? ""} />
                        <i className="fa-solid fa-arrow-up-right-from-square ml-2 text-xs" aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="min-w-0 text-sm font-medium text-slate-600">
                        <T th={place.name} en={place.nameEn ?? ""} />
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
          {project.settings.virtual_tour_url && (
            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-brand-muted p-4">
              <div className="mb-3 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="font-extrabold text-brand-primary">Map 3D / Virtual Tour</h3>
                <a
                  href={String(project.settings.virtual_tour_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-brand-primary px-4 py-2 text-xs font-bold text-white"
                >
                  <T th="เปิดเต็มหน้าจอ" en="Open full screen" />
                </a>
              </div>
              <iframe
                src={String(project.settings.virtual_tour_url)}
                title={`Virtual Tour ${project.name}`}
                className="h-72 w-full rounded-xl bg-white sm:h-112"
                loading="lazy"
                allowFullScreen
              />
            </div>
          )}
        </div>
      </section>

      <section id="register" className="relative overflow-hidden bg-brand-primary py-12 text-white sm:py-16 lg:py-20">
        <span
          className="absolute -right-20 -bottom-28 size-96 rounded-full bg-brand-accent/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="project-container relative">
          <div className="mb-7 flex flex-col gap-5 lg:mb-9 lg:flex-row lg:items-end lg:justify-between lg:gap-10">
            <div className="max-w-3xl">
              <p className="mb-3 text-[11px] font-bold tracking-[0.2em] text-brand-accent">YOUR NEXT CHAPTER</p>
              <h2 className="text-2xl font-extrabold leading-snug tracking-tight sm:text-3xl lg:text-4xl">
                <T th="บ้านที่ใช่ เริ่มต้นได้ที่นี่" en="Your next chapter starts here" />
              </h2>
              <p className="mt-3 text-sm font-medium text-white/80 sm:text-base">
                <T th={project.name} en={project.name_en ?? ""} />
              </p>
            </div>
            <p className="max-w-lg text-sm leading-7 text-white/80">
              <T
                th="ลงทะเบียนรับข้อเสนอพิเศษ พร้อมให้ทีมงานแนะนำบ้านและข้อมูลโครงการที่เหมาะกับคุณ"
                en="Register for exclusive offers and let our team help you find the right home."
              />
            </p>
          </div>
          <div className="w-full rounded-2xl border border-white/30 bg-white p-5 text-left text-slate-700 shadow-registration sm:p-7 lg:p-9">
            <LeadRegistrationForm>
              {project.id && <Input type="hidden" name="projectId" value={project.id} />}
              <section className="border-b border-slate-100 pb-6">
                <h3 className="mb-5 flex items-center gap-3 font-bold text-brand-primary">
                  <span className="grid size-8 place-items-center rounded-xl bg-brand-accent-soft text-xs">01</span>
                  <T th="ข้อมูลส่วนตัว" en="Personal information" />
                </h3>
                <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
                  <RegistrationField name="firstName" th="ชื่อ" en="First name" autoComplete="given-name" />
                  <RegistrationField name="lastName" th="นามสกุล" en="Last name" autoComplete="family-name" />
                  <RegistrationField name="email" type="email" th="อีเมล" en="Email" autoComplete="email" />
                  <RegistrationField name="phone" type="tel" th="เบอร์โทรศัพท์" en="Phone" autoComplete="tel" />
                  <RegistrationField
                    name="familyMembers"
                    type="number"
                    th="จำนวนสมาชิกในครอบครัว"
                    en="Number of family members"
                  />
                  <label className="text-sm font-semibold">
                    <T th="ช่วงอายุ" en="Age range" /> <span className="text-red-500">*</span>
                    <Select name="ageRange" required defaultValue="">
                      <option value="" disabled>
                        —
                      </option>
                      {leadAgeRanges.map((age) => (
                        <option key={age} value={age}>
                          <T
                            th={age === "ไม่ระบุ" || age === "มากกว่า 60" ? age : `ช่วงอายุ ${age}`}
                            en={age === "มากกว่า 60" ? "Over 60" : age === "ไม่ระบุ" ? "Prefer not to disclose" : age}
                          />
                        </option>
                      ))}
                    </Select>
                  </label>
                  <label className="text-sm font-semibold sm:col-span-2">
                    <T th="อาชีพ" en="Occupation" /> <span className="text-red-500">*</span>
                    <Select name="occupation" required defaultValue="">
                      <option value="" disabled>
                        —
                      </option>
                      {leadOccupations.map((occupation) => (
                        <option key={occupation} value={occupation}>
                          <T th={occupation} en={occupationEnglish[occupation]} />
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>
              </section>
              <section className="border-b border-slate-100 pb-6">
                <h3 className="mb-5 flex items-center gap-3 font-bold text-brand-primary">
                  <span className="grid size-8 place-items-center rounded-xl bg-brand-accent-soft text-xs">02</span>
                  <T th="ที่อยู่ปัจจุบัน" en="Current address" />
                </h3>
                <div className="grid gap-5 md:grid-cols-3">
                  <RegistrationField name="province" th="จังหวัด" en="Province" autoComplete="address-level1" />
                  <RegistrationField name="district" th="เขต / อำเภอ" en="District" autoComplete="address-level2" />
                  <RegistrationField
                    name="subdistrict"
                    th="ตำบล / แขวง"
                    en="Subdistrict"
                    autoComplete="address-level3"
                  />
                </div>
              </section>
              <div className="grid gap-6 md:grid-cols-2">
                <fieldset className="rounded-2xl border border-slate-100 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold">
                    <T th="ประเภทที่อยู่อาศัยปัจจุบัน" en="Current residence type" />{" "}
                    <span className="text-red-500">*</span>
                  </legend>
                  <div className="mt-3 grid gap-3 lg:grid-cols-3">
                    {[
                      { value: "HOUSE", th: "บ้าน", en: "House" },
                      { value: "CONDO", th: "คอนโดมิเนียม", en: "Condominium" },
                      { value: "DORMITORY", th: "อพาร์ทเม้น", en: "Apartment" },
                    ].map((item) => (
                      <label
                        key={item.value}
                        className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm transition hover:border-brand-primary/40 has-checked:border-brand-primary has-checked:bg-brand-soft has-checked:text-brand-primary"
                      >
                        <Input
                          type="radio"
                          name="residenceType"
                          value={item.value}
                          required
                          className="accent-brand-primary"
                        />
                        <T th={item.th} en={item.en} />
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="space-y-5 rounded-2xl border border-slate-100 p-4 sm:p-5">
                  <label className="block text-sm font-semibold">
                    <T th="งบประมาณ" en="Budget" /> <span className="text-red-500">*</span>
                    <Select name="budget" required defaultValue="">
                      <option value="" disabled>
                        —
                      </option>
                      {[
                        { th: "1-2 ล้านบาท", en: "THB 1–2 million" },
                        { th: "2-3 ล้านบาท", en: "THB 2–3 million" },
                        { th: "3-5 ล้านบาท", en: "THB 3–5 million" },
                        { th: "มากกว่า 5 ล้านบาท", en: "More than THB 5 million" },
                      ].map((item) => (
                        <option key={item.th} value={item.th}>
                          <T {...item} />
                        </option>
                      ))}
                    </Select>
                  </label>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <RegistrationField
                      name="preferredContactDate"
                      type="date"
                      th="วันที่สะดวกให้ติดต่อกลับ"
                      en="Preferred contact date"
                    />
                    <RegistrationField
                      name="preferredContactTime"
                      type="time"
                      th="ช่วงเวลาที่สะดวก"
                      en="Preferred contact time"
                    />
                  </div>
                </div>
              </div>
              <fieldset className="rounded-2xl border border-brand-primary/10 bg-brand-soft/40 p-4 sm:p-5">
                <legend className="px-1 text-sm font-semibold">
                  <T th="การรับข่าวสาร" en="News updates" />
                </legend>
                <div className="space-y-3 text-sm text-slate-600">
                  <label className="flex items-start gap-2">
                    <Input type="checkbox" name="consentNews" value="true" className="mt-1 accent-brand-primary" />
                    <T
                      th="ท่านต้องการรับข่าวสารจาก Mida Property"
                      en="I would like to receive news from MIDA Property."
                    />
                  </label>
                  <label className="flex items-start gap-2">
                    <Input
                      type="checkbox"
                      name="consentContact"
                      value="true"
                      required
                      className="mt-1 accent-brand-primary"
                    />
                    <T
                      th="ท่านยินยอมให้เจ้าหน้าที่ติดต่อกลับในช่วงเวลาที่ท่านกำหนด"
                      en="I consent to being contacted during my preferred time."
                    />
                    <span className="text-red-500">*</span>
                  </label>
                </div>
              </fieldset>
            </LeadRegistrationForm>
          </div>
        </div>
      </section>
      <FloatingContactWidget
        lineUrl={safeContactUrl(project.settings.line_url)}
        messengerUrl={safeContactUrl(contactContent?.body)}
        phone={project.settings.phone ?? ""}
        email={project.settings.email ?? ""}
      />
    </main>
  );
}

function RegistrationField({
  name,
  th,
  en,
  type = "text",
  autoComplete,
}: {
  name: string;
  th: string;
  en: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="text-sm font-semibold">
      <T th={th} en={en} /> <span className="text-red-500">*</span>
      <Input
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 99 : undefined}
        className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand-primary"
      />
    </label>
  );
}
