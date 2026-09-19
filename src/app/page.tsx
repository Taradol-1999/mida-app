import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { HeroImageSlider } from "@/components/hero-image-slider";
import { LeadModal } from "@/components/lead-modal";
import { NewsPromotionSlider, type NewsPromotionItem } from "@/components/news-promotion-slider";
import { ProjectFilter } from "@/components/project-filter";
import { db } from "@/lib/db";

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
    const [contentRows, updateRows, heroImageRows] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT content_key, title, body FROM site_content"),
      pool.query<RowDataPacket[]>(
        `SELECT tag, title, detail FROM (SELECT 'PROMOTION' AS tag, title, COALESCE(body, '') AS detail, created_at AS published_on FROM promotions WHERE is_published=TRUE UNION ALL SELECT category AS tag, title, COALESCE(body, '') AS detail, published_at AS published_on FROM news_items WHERE is_published=TRUE) updates ORDER BY published_on DESC LIMIT 12`,
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
    };
  } catch {
    return { content: {}, updates: defaultUpdates, heroImages: [] };
  }
}

export default async function HomePage() {
  const { content, updates, heroImages } = await homeData();
  return (
    <main>
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-page flex h-18 items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-[#002D62]">
            <span className="grid size-9 place-items-center rounded bg-[#002D62] text-sm text-white">M</span>
            <span>
              MIDA <span className="hidden sm:inline">PROPERTY</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">
            {nav.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-[#002D62]">
                {item.label}
              </a>
            ))}
            <Link
              href="/login"
              className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:border-[#002D62]"
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
          <div className="gold-rule mb-3" />
          <h2 className="section-title">ข่าวสารและโปรโมชั่น</h2>
          <NewsPromotionSlider items={updates} />
        </div>
      </section>
      <section id="location" className="container-page py-16">
        <div className="grid overflow-hidden rounded-2xl bg-[#001B3D] md:grid-cols-2">
          <div className="p-8 text-white md:p-12">
            <p className="text-sm font-bold text-[#F5A623]">MIDA LOCATION</p>
            <h2 className="mt-3 text-3xl font-extrabold">
              ทุกทำเลสำคัญ
              <br />
              อยู่ใกล้ชีวิตคุณ
            </h2>
            <p className="mt-5 leading-7 text-slate-200">
              แผนที่โครงการพร้อมจุดสำคัญรอบด้าน เพื่อช่วยให้เห็นภาพการเดินทางก่อนเข้าชมจริง
            </p>
            <Link href="/projects/grand-village-petchkasem#map" className="mt-7 inline-block font-bold text-[#f8c366]">
              ดูแผนที่ 3D และสถานที่ใกล้เคียง →
            </Link>
          </div>
          <div className="relative min-h-80 bg-[radial-gradient(circle_at_60%_45%,#f5a623_0_5px,transparent_6px),linear-gradient(125deg,#7f9db2_2%,#d9e4e8_2%_5%,#afc1c9_5%_9%,#e8eef0_9%_13%,#8ba4b0_13%_17%,#dce5e8_17%)]">
            <span className="absolute left-[58%] top-[42%] rounded-full bg-[#002D62] px-3 py-1.5 text-xs font-bold text-white shadow-lg">
              MIDA
            </span>
            <span className="absolute left-[28%] top-[24%] rounded-full bg-white px-3 py-1 text-xs font-bold text-[#002D62] shadow">
              โรงพยาบาล
            </span>
            <span className="absolute bottom-[18%] right-[16%] rounded-full bg-white px-3 py-1 text-xs font-bold text-[#002D62] shadow">
              ห้างสรรพสินค้า
            </span>
          </div>
        </div>
      </section>
      <footer className="bg-[#001B3D] py-9 text-sm text-slate-300">
        <div className="container-page flex flex-col justify-between gap-3 md:flex-row">
          <p>© {new Date().getFullYear()} MIDA Agency & Development</p>
          <p>{content.contact?.body ?? "โทร 02-000-0000 · Line @midaagency"}</p>
        </div>
      </footer>
      <LeadModal />
    </main>
  );
}
