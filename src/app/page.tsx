import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { LeadModal } from "@/components/lead-modal";
import { ProjectFilter } from "@/components/project-filter";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const nav = [{ href: "#projects", label: "โครงการ" }, { href: "#promotion", label: "ข่าวสารและโปรโมชั่น" }, { href: "#location", label: "ทำเลที่ตั้ง" }];

const defaultUpdates = [["PROMOTION", "สิทธิพิเศษสำหรับครอบครัว MIDA", "ข้อเสนอพิเศษสำหรับลูกค้าใหม่และลูกค้า MIDA Family"], ["NEWS", "MIDA ร่วมมือกับ ธอส.", "สนับสนุนการเข้าถึงที่อยู่อาศัยอย่างมั่นคง"], ["EVENT", "พบกันที่งาน MIDA Home Fair", "เยี่ยมชมโครงการและรับข้อเสนอภายในงาน"]];

async function homeData() {
  try {
    const pool = db();
    const [contentRows, updateRows] = await Promise.all([
      pool.query<RowDataPacket[]>("SELECT content_key, title, body FROM site_content"),
      pool.query<RowDataPacket[]>(`SELECT tag, title, detail FROM (SELECT 'PROMOTION' AS tag, title, COALESCE(body, '') AS detail, created_at AS published_on FROM promotions WHERE is_published=TRUE UNION ALL SELECT category AS tag, title, COALESCE(body, '') AS detail, published_at AS published_on FROM news_items WHERE is_published=TRUE) updates ORDER BY published_on DESC LIMIT 3`),
    ]);
    return { content: Object.fromEntries(contentRows[0].map((row) => [row.content_key, { title: row.title, body: row.body }])), updates: updateRows[0].length ? updateRows[0].map((row) => [String(row.tag), String(row.title), String(row.detail)]) : defaultUpdates };
  } catch { return { content: {}, updates: defaultUpdates }; }
}

export default async function HomePage() {
  const { content, updates } = await homeData();
  return <main>
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur"><div className="container-page flex h-18 items-center justify-between gap-6"><Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-[#002D62]"><span className="grid size-9 place-items-center rounded bg-[#002D62] text-sm text-white">M</span><span>MIDA <span className="hidden sm:inline">AGENCY & DEVELOPMENT</span></span></Link><nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 md:flex">{nav.map((item) => <a key={item.href} href={item.href} className="hover:text-[#002D62]">{item.label}</a>)}<Link href="/login" className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:border-[#002D62]">ผู้ดูแลระบบ</Link></nav></div></header>
    <section className="relative overflow-hidden bg-[#002D62]"><div className="hero-shade absolute inset-0" /><div className="container-page relative min-h-120 py-24 text-white md:flex md:items-center"><div className="max-w-3xl"><p className="mb-5 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold tracking-wide text-[#f8c366]">PREMIUM RESIDENCES</p><h1 className="max-w-2xl text-4xl font-extrabold leading-tight md:text-6xl">{content.home_hero?.title ?? "พื้นที่ที่ตอบทุกนิยามของคำว่า บ้าน"}</h1><p className="mt-6 max-w-xl text-lg leading-8 text-slate-100">{content.home_hero?.body ?? "ค้นพบโครงการคุณภาพจาก MIDA ที่ออกแบบเพื่อการอยู่อาศัยอย่างมีความสุข และเติบโตได้ในทุกวัน"}</p><a className="button-primary mt-8 bg-[#F5A623] text-[#001B3D] hover:bg-[#ffc256]" href="#projects">ค้นหาโครงการ</a></div></div></section>
    <ProjectFilter />
    <section id="promotion" className="bg-white py-16"><div className="container-page"><div className="gold-rule mb-3" /><h2 className="section-title">ข่าวสารและโปรโมชั่น</h2><div className="mt-7 grid gap-5 md:grid-cols-3">{updates.map(([tag, title, detail]) => <article key={`${tag}-${title}`} className="rounded-2xl border border-slate-200 p-6"><p className="text-xs font-extrabold text-[#F5A623]">{tag}</p><h3 className="mt-3 text-xl font-extrabold text-[#002D62]">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-500">{detail}</p></article>)}</div></div></section>
    <section id="location" className="container-page py-16"><div className="grid overflow-hidden rounded-2xl bg-[#001B3D] md:grid-cols-2"><div className="p-8 text-white md:p-12"><p className="text-sm font-bold text-[#F5A623]">MIDA LOCATION</p><h2 className="mt-3 text-3xl font-extrabold">ทุกทำเลสำคัญ<br />อยู่ใกล้ชีวิตคุณ</h2><p className="mt-5 leading-7 text-slate-200">แผนที่โครงการพร้อมจุดสำคัญรอบด้าน เพื่อช่วยให้เห็นภาพการเดินทางก่อนเข้าชมจริง</p><Link href="/projects/grand-village-petchkasem#map" className="mt-7 inline-block font-bold text-[#f8c366]">ดูแผนที่ 3D และสถานที่ใกล้เคียง →</Link></div><div className="relative min-h-80 bg-[radial-gradient(circle_at_60%_45%,#f5a623_0_5px,transparent_6px),linear-gradient(125deg,#7f9db2_2%,#d9e4e8_2%_5%,#afc1c9_5%_9%,#e8eef0_9%_13%,#8ba4b0_13%_17%,#dce5e8_17%)]"><span className="absolute left-[58%] top-[42%] rounded-full bg-[#002D62] px-3 py-1.5 text-xs font-bold text-white shadow-lg">MIDA</span><span className="absolute left-[28%] top-[24%] rounded-full bg-white px-3 py-1 text-xs font-bold text-[#002D62] shadow">โรงพยาบาล</span><span className="absolute bottom-[18%] right-[16%] rounded-full bg-white px-3 py-1 text-xs font-bold text-[#002D62] shadow">ห้างสรรพสินค้า</span></div></div></section>
    <footer className="bg-[#001B3D] py-9 text-sm text-slate-300"><div className="container-page flex flex-col justify-between gap-3 md:flex-row"><p>© {new Date().getFullYear()} MIDA Agency & Development</p><p>{content.contact?.body ?? "โทร 02-000-0000 · Line @midaagency"}</p></div></footer>
    <LeadModal />
  </main>;
}
