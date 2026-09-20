import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { ProjectLocationMap } from "@/components/project-location-map";
import { LeadModal } from "@/components/lead-modal";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { db } from "@/lib/db";
import type { MapProject } from "@/lib/project-map";

export const dynamic = "force-dynamic";

const nav = [
  { href: "#projects", label: "โครงการ" },
  { href: "#promotion", label: "ข่าวสารและโปรโมชั่น" },
  { href: "#location", label: "ทำเลที่ตั้ง" },
];

const defaultUpdates: NewsPromotionItem[] = [
  ["PROMOTION", "สิทธิพิเศษสำหรับครอบครัว MIDA", "ข้อเสนอพิเศษสำหรับลูกค้าใหม่และลูกค้า MIDA Family"],
  ["NEWS", "MIDA ร่วมมือกับ ธอส.", "สนับสนุนการเข้าถึงที่อยู่อาศัยอย่างมั่นคง"],
  ["EVENT", "พบกันที่งาน MIDA Home Fair", "เยี่ยมชมโครงการและรับข้อเสนอภายในงาน"],
];

async function homeData() {
  try {
    const pool = db();
    const [contentRows, updateRows, projectRows, heroImageRows] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT content_key, title, body FROM site_content"),
      pool.query<RowDataPacket[]>(
        `SELECT tag, title, detail FROM (SELECT 'PROMOTION' AS tag, title, COALESCE(body, '') AS detail, created_at AS published_on FROM promotions WHERE is_published=TRUE UNION ALL SELECT category AS tag, title, COALESCE(body, '') AS detail, published_at AS published_on FROM news_items WHERE is_published=TRUE) updates ORDER BY published_on DESC LIMIT 12`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT p.id, p.slug, p.name_th, p.location, p.latitude, p.longitude, s.map_url
         FROM projects p LEFT JOIN project_settings s ON s.project_id = p.id
         WHERE p.status <> 'ARCHIVED' ORDER BY p.name_th`,
      ),
      pool.query<RowDataPacket[]>(
        `SELECT m.original_name, m.mime_type, m.storage_key
         FROM media_assets m
         INNER JOIN site_content s ON s.id = m.entity_id
         WHERE m.entity_type='site-content' AND m.media_kind='hero' AND s.content_key='home_hero'
         ORDER BY m.sort_order, m.created_at`,
      ),
    ]);
    return {
      content: Object.fromEntries(contentRows[0].map((row) => [row.content_key, { title: row.title, body: row.body }])),
      updates: updateRows[0].length
        ? updateRows[0].map((row) => [String(row.tag), String(row.title), String(row.detail)] as NewsPromotionItem)
        : defaultUpdates,
      heroImages: heroImageRows[0].map((row) => ({
        src: `/${String(row.storage_key)}`,
        alt: String(row.original_name || "แบนเนอร์ MIDA Property"),
        type: String(row.mime_type).startsWith("video/") ? ("video" as const) : ("image" as const),
      })),
      mapProjects: projectRows[0].map((row): MapProject => ({
        id: String(row.id),
        slug: String(row.slug),
        name: String(row.name_th),
        location: String(row.location),
        latitude: row.latitude === null ? null : Number(row.latitude),
        longitude: row.longitude === null ? null : Number(row.longitude),
        mapUrl: row.map_url ? String(row.map_url) : null,
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
        <div className="container-page flex h-18 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-brand-primary">
            <span className="grid size-9 place-items-center rounded bg-brand-accent text-sm text-brand-primary">M</span>
            <span>
              MIDA <span className="hidden sm:inline">PROPERTY</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-brand-primary">
                {item.label}
              </a>
            ))}
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
        </div>
      </header>
      <HeroImageSlider
        images={heroImages}
        title={content.home_hero?.title ?? ""}
        description={content.home_hero?.body ?? ""}
      />
      <ProjectFilter />
      <section id="promotion" className="bg-white py-16">
        <div className="container-page">
          <div className="gold-rule" />
          <h2 className="section-title">ข่าวสารและโปรโมชั่น</h2>
          <NewsPromotionSlider items={updates} />
        </div>
      </section>
      <section id="location" className="bg-brand-muted py-16">
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
      <footer className="bg-brand-primary py-9 text-sm text-white/80">
        <div className="container-page flex flex-col justify-between gap-3 md:flex-row">
          <p>© {new Date().getFullYear()} MIDA Agency & Development</p>
          <p>{content.contact?.body ?? "โทร 02-000-0000 · Line @midaagency"}</p>
        </div>
      </footer>
      <LeadModal />
    </main>
  );
}
