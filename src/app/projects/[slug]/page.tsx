import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { HouseTypeCarousel, type HouseTypeItem } from "@/components/house-type-carousel";
import { LeadModal } from "@/components/lead-modal";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectGallery, type ProjectGalleryItem } from "@/components/project-gallery";
import { findProject } from "@/data/projects";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const emptySettings = {
  hero_title_th: null,
  hero_subtitle_th: null,
  phone: null,
  email: null,
  map_url: null,
  nearby_places_th: null,
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
    houseTypes: [] as RowDataPacket[],
    promotions: [] as RowDataPacket[],
    news: [] as RowDataPacket[],
    heroMedia: [] as ProjectGalleryItem[],
    galleryMedia: [] as ProjectGalleryItem[],
    settings: emptySettings,
  };
  try {
    const [rows] = await db().execute<RowDataPacket[]>(
      "SELECT * FROM projects WHERE slug = ? AND status <> 'ARCHIVED' LIMIT 1",
      [slug],
    );
    const row = rows[0];
    if (!row) return fallbackData;
    const [facilityRows, houseTypeRows, promotionRows, newsRows, settingRows, mediaRows] = await Promise.all([
      db()
        .execute<RowDataPacket[]>("SELECT name FROM facilities WHERE project_id = ? ORDER BY sort_order", [row.id])
        .then(([items]) => items),
      db()
        .execute<RowDataPacket[]>(
          `SELECT h.id, h.name, h.bedrooms, h.bathrooms, h.usable_area_sqm, h.starting_price,
           (SELECT m.id FROM media_assets m WHERE m.entity_type='house-types' AND m.entity_id=h.id AND m.media_kind='cover' LIMIT 1) AS image_id
           FROM house_types h WHERE h.project_id = ? ORDER BY h.starting_price`,
          [row.id],
        )
        .then(([items]) => items),
      db()
        .execute<RowDataPacket[]>(
          "SELECT title, body FROM promotions WHERE project_id = ? AND is_published=TRUE ORDER BY created_at DESC",
          [row.id],
        )
        .then(([items]) => items),
      db()
        .execute<RowDataPacket[]>(
          "SELECT title, body, published_at FROM news_items WHERE project_id = ? AND is_published=TRUE ORDER BY published_at DESC",
          [row.id],
        )
        .then(([items]) => items),
      db()
        .execute<RowDataPacket[]>("SELECT * FROM project_settings WHERE project_id = ? LIMIT 1", [row.id])
        .then(([items]) => items),
      db()
        .execute<RowDataPacket[]>(
          "SELECT id, media_kind, original_name, mime_type FROM media_assets WHERE entity_type='projects' AND entity_id=? AND media_kind IN ('cover', 'hero') ORDER BY FIELD(media_kind, 'cover', 'hero'), sort_order, created_at",
          [row.id],
        )
        .then(([items]) => items),
    ]);
    const media = mediaRows.map((item) => ({
      src: `/api/admin/media?entityType=projects&entityId=${row.id}&mediaKind=${item.media_kind}&mediaId=${item.id}`,
      alt: String(item.original_name || `ภาพโครงการ ${row.name_th}`),
      type: String(item.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
    }));
    const heroMedia = media.filter((_, index) => mediaRows[index].media_kind === "hero");
    const cover = media.find((_, index) => mediaRows[index].media_kind === "cover");
    return {
      id: String(row.id),
      slug: row.slug,
      name: row.name_th,
      location: row.location,
      type: projectType(row.property_type),
      price: `${(Number(row.starting_price) / 1000000).toLocaleString("th-TH", { maximumFractionDigits: 3 })} ล้านบาท*`,
      status: row.status === "READY" ? "พร้อมอยู่" : "กำลังก่อสร้าง",
      label: "MIDA PROPERTY",
      description: row.description ?? "",
      facilities: facilityRows.map((facility) => facility.name),
      landmarks: fallback?.landmarks ?? ["โปรดเพิ่มสถานที่ใกล้เคียงจากหลังบ้าน"],
      houseTypes: houseTypeRows,
      promotions: promotionRows,
      news: newsRows,
      settings: { ...emptySettings, ...(settingRows[0] ?? {}) },
      coverUrl: cover?.src ?? null,
      heroMedia: heroMedia.length ? heroMedia : cover ? [cover] : [],
      galleryMedia: media,
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
    bedrooms: String(house.bedrooms ?? "-"),
    bathrooms: String(house.bathrooms ?? "-"),
    usableArea: String(house.usable_area_sqm ?? "-"),
    startingPrice: Number(house.starting_price ?? 0),
    imageUrl: house.image_id
      ? `/api/admin/media?entityType=house-types&entityId=${house.id}&mediaKind=cover&mediaId=${house.image_id}`
      : null,
  }));
  return (
    <main className="bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="project-container flex min-h-18 items-center justify-between gap-4">
          <Link
            href="/"
            aria-label={`กลับหน้าหลัก MIDA จากโครงการ ${project.name}`}
            className="flex min-w-0 items-center gap-2 font-extrabold text-[#002D62]"
          >
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-red-500 text-xs text-white">
              {String(project.name).charAt(0).toUpperCase()}
            </span>
            <span className="truncate text-sm sm:text-base">{project.name}</span>
          </Link>
          <nav className="hidden items-center gap-5 text-xs font-semibold text-slate-600 lg:flex">
            <a href="#overview" className="border-b-2 border-[#002D62] pb-1 text-[#002D62]">
              หน้าหลักโครงการ
            </a>
            <a href="#project-promo-news" className="hover:text-[#002D62]">
              โปรโมชั่น ข่าวสาร & กิจกรรม
            </a>
            <a href="#map" className="hover:text-[#002D62]">
              ติดต่อโครงการ
            </a>
          </nav>
          <a href="#register" className="rounded-lg bg-[#002D62] px-3 py-2 text-xs font-bold text-white">
            นัดชมโครงการ
          </a>
        </div>
      </header>
      <HeroImageSlider
        images={project.heroMedia}
        title={heroTitle}
        description={heroDescription}
        meta={`ราคาเริ่มต้น ${project.price}`}
      />
      <section id="overview" className="project-container grid gap-8 py-10 lg:grid-cols-2">
        <ProjectGallery items={project.galleryMedia} />
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="border-b border-slate-100 pb-3 text-base font-bold text-[#002D62]">
            <i className="fa-solid fa-star mr-2 text-[#f5a623]" />
            สิ่งอำนวยความสะดวกในโครงการ
          </h2>
          <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {project.facilities.map((item) => (
              <div key={item} className="rounded-lg bg-slate-50 p-3">
                <i className="fa-solid fa-circle-check mr-2 text-[#002D62]" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
      {project.houseTypes.length > 0 && (
        <section className="bg-white py-16">
          <div className="project-container">
            <div className="gold-rule mb-3" />
            <h2 className="section-title">รูปแบบบ้านและราคาเริ่มต้น (House Types)</h2>
            <HouseTypeCarousel items={houseTypeItems} />
          </div>
        </section>
      )}
      {projectUpdates.length > 0 && (
        <section id="project-promo-news" className="bg-red-50/60 py-16">
          <div className="project-container">
            <h2 className="text-2xl font-bold text-red-800 md:text-3xl">
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
          <p className="mt-2 text-slate-500">ข้อมูลติดต่อและสถานที่ใกล้เคียงที่ตั้งค่าจากหลังบ้าน</p>
          <div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="grid min-h-96 place-items-center rounded-2xl border-8 border-white bg-[linear-gradient(125deg,#9bb3bd_2%,#e9f0ee_2%_5%,#bdcfce_5%_8%,#f7f3df_8%_10%,#a8c0be_10%_14%,#e9eef0_14%)] shadow-inner">
              <div className="rounded-xl bg-[#002D62] px-5 py-3 text-center font-bold text-white shadow-xl">
                {project.name}
                <br />
                <span className="text-xs font-normal text-[#f8c366]">{project.location}</span>
                {project.settings.map_url && (
                  <a
                    href={String(project.settings.map_url)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-xs underline"
                  >
                    เปิด Google Maps
                  </a>
                )}
              </div>
            </div>
            <aside className="rounded-2xl bg-[#f5f7fa] p-6">
              <h3 className="font-extrabold text-[#002D62]">สถานที่ใกล้เคียง</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                {landmarks.map((landmark) => (
                  <li key={landmark} className="border-b border-slate-200 pb-3">
                    {landmark}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </div>
      </section>
      <section id="register" className="project-container py-16 text-center">
        <h2 className="section-title">รับข้อเสนอพิเศษ</h2>
        <p className="mt-3 text-slate-500">ลงทะเบียนเพื่อรับข้อมูลโครงการและนัดหมายเข้าชม</p>
        {project.settings.phone && <p className="mt-3 font-bold text-[#002D62]">โทร {project.settings.phone}</p>}
        {project.settings.email && <p className="mt-1 text-sm text-slate-500">{project.settings.email}</p>}
        <p className="mt-3 text-xs text-slate-400">
          * ราคาและรายละเอียดเป็นข้อมูลจำลอง โปรดตรวจสอบกับฝ่ายขายก่อนตัดสินใจ
        </p>
      </section>
      <LeadModal />
    </main>
  );
}
