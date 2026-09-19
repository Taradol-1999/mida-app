/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import type { RowDataPacket } from "mysql2";
import { notFound } from "next/navigation";
import { LeadModal } from "@/components/lead-modal";
import { findProject } from "@/data/projects";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
const emptySettings = { hero_title_th: null, hero_subtitle_th: null, phone: null, email: null, map_url: null, nearby_places_th: null };
const projectType = (value: string) => value === "TOWNHOME" ? "ทาวน์โฮม" : value === "SEMI_DETACHED" ? "บ้านแฝด" : value === "COMMERCIAL" ? "อาคารพาณิชย์" : "บ้านเดี่ยว";

async function getProject(slug: string) {
  const fallback = findProject(slug);
  const fallbackData = fallback && { ...fallback, id: null, coverUrl: null, houseTypes: [] as RowDataPacket[], promotions: [] as RowDataPacket[], news: [] as RowDataPacket[], settings: emptySettings };
  try {
    const [rows] = await db().execute<RowDataPacket[]>("SELECT * FROM projects WHERE slug = ? AND status <> 'ARCHIVED' LIMIT 1", [slug]);
    const row = rows[0];
    if (!row) return fallbackData;
    const [facilityRows, houseTypeRows, promotionRows, newsRows, settingRows, mediaRows] = await Promise.all([
      db().execute<RowDataPacket[]>("SELECT name FROM facilities WHERE project_id = ? ORDER BY sort_order", [row.id]).then(([items]) => items),
      db().execute<RowDataPacket[]>("SELECT name, bedrooms, bathrooms, usable_area_sqm, starting_price FROM house_types WHERE project_id = ? ORDER BY starting_price", [row.id]).then(([items]) => items),
      db().execute<RowDataPacket[]>("SELECT title, body FROM promotions WHERE project_id = ? AND is_published=TRUE ORDER BY created_at DESC", [row.id]).then(([items]) => items),
      db().execute<RowDataPacket[]>("SELECT title, body, published_at FROM news_items WHERE project_id = ? AND is_published=TRUE ORDER BY published_at DESC", [row.id]).then(([items]) => items),
      db().execute<RowDataPacket[]>("SELECT * FROM project_settings WHERE project_id = ? LIMIT 1", [row.id]).then(([items]) => items),
      db().execute<RowDataPacket[]>("SELECT id FROM media_assets WHERE entity_type='projects' AND entity_id=? AND media_kind='cover' LIMIT 1", [row.id]).then(([items]) => items),
    ]);
    return { id: String(row.id), slug: row.slug, name: row.name_th, location: row.location, type: projectType(row.property_type), price: `${(Number(row.starting_price) / 1000000).toLocaleString("th-TH", { maximumFractionDigits: 3 })} ล้านบาท*`, status: row.status === "READY" ? "พร้อมอยู่" : "กำลังก่อสร้าง", label: "MIDA PROPERTY", description: row.description ?? "", facilities: facilityRows.map((facility) => facility.name), landmarks: fallback?.landmarks ?? ["โปรดเพิ่มสถานที่ใกล้เคียงจากหลังบ้าน"], houseTypes: houseTypeRows, promotions: promotionRows, news: newsRows, settings: { ...emptySettings, ...(settingRows[0] ?? {}) }, coverUrl: mediaRows.length ? `/api/admin/media?entityType=projects&entityId=${row.id}` : null };
  } catch { return fallbackData; }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params; const project = await getProject(slug); if (!project) notFound();
  const heroTitle = project.settings.hero_title_th || project.name;
  const heroDescription = project.settings.hero_subtitle_th || project.description;
  const landmarks = project.settings.nearby_places_th ? String(project.settings.nearby_places_th).split("\n").map((item) => item.trim()).filter(Boolean) : project.landmarks;
  return <main><header className="border-b bg-white"><div className="container-page flex h-18 items-center justify-between"><Link href="/" className="font-extrabold text-[#002D62]">MIDA PROJECT SITE</Link><a href="#register" className="button-primary text-sm">นัดชมโครงการ</a></div></header>
    <section className="bg-[#001B3D] py-22 text-center text-white"><p className="text-sm font-bold text-[#F5A623]">{project.label} · {project.location}</p><h1 className="mt-4 text-4xl font-extrabold md:text-5xl">{heroTitle}</h1><p className="mx-auto mt-5 max-w-2xl text-slate-200">{heroDescription}</p><p className="mt-5 text-lg font-extrabold text-[#f8c366]">ราคาเริ่มต้น {project.price}</p></section>
    <section className="container-page grid gap-8 py-16 md:grid-cols-2"><div className="min-h-80 overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#aec4ce,#eff4f4_50%,#698796)]">{project.coverUrl && <img src={project.coverUrl} alt={`ภาพโครงการ ${project.name}`} className="h-full min-h-80 w-full object-cover" />}</div><div><div className="gold-rule mb-3" /><h2 className="section-title">สิ่งอำนวยความสะดวก</h2><p className="mt-4 leading-7 text-slate-600">สิ่งอำนวยความสะดวกและส่วนกลางของโครงการ</p><div className="mt-6 grid gap-3 sm:grid-cols-2">{project.facilities.map((item) => <div key={item} className="rounded-xl bg-white p-4 font-bold text-[#002D62] shadow-sm">{item}</div>)}</div></div></section>
    {project.houseTypes.length > 0 && <section className="bg-white py-16"><div className="container-page"><div className="gold-rule mb-3" /><h2 className="section-title">แบบบ้าน</h2><div className="mt-7 grid gap-4 md:grid-cols-3">{project.houseTypes.map((house) => <article key={house.name} className="rounded-2xl border border-slate-200 p-5"><h3 className="font-extrabold text-[#002D62]">{house.name}</h3><p className="mt-3 text-sm text-slate-600">{house.bedrooms} ห้องนอน · {house.bathrooms} ห้องน้ำ</p><p className="mt-2 text-sm text-slate-600">พื้นที่ใช้สอย {house.usable_area_sqm} ตร.ม.</p><p className="mt-4 font-extrabold text-[#F5A623]">เริ่ม {Number(house.starting_price).toLocaleString("th-TH")} บาท</p></article>)}</div></div></section>}
    {project.promotions.length > 0 && <section className="container-page py-16"><div className="gold-rule mb-3" /><h2 className="section-title">โปรโมชั่นโครงการ</h2><div className="mt-7 grid gap-4 md:grid-cols-2">{project.promotions.map((promotion) => <article key={promotion.title} className="rounded-2xl bg-[#f5f7fa] p-6"><h3 className="font-extrabold text-[#002D62]">{promotion.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{promotion.body}</p></article>)}</div></section>}
    {project.news.length > 0 && <section className="bg-white py-16"><div className="container-page"><div className="gold-rule mb-3" /><h2 className="section-title">ข่าวสารโครงการ</h2><div className="mt-7 grid gap-4 md:grid-cols-2">{project.news.map((item) => <article key={item.title} className="rounded-2xl border border-slate-200 p-6"><h3 className="font-extrabold text-[#002D62]">{item.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{item.body}</p></article>)}</div></div></section>}
    <section id="map" className="bg-white py-16"><div className="container-page"><h2 className="section-title">แผนที่และสถานที่ใกล้เคียง</h2><p className="mt-2 text-slate-500">ข้อมูลติดต่อและสถานที่ใกล้เคียงที่ตั้งค่าจากหลังบ้าน</p><div className="mt-7 grid gap-6 lg:grid-cols-[1.35fr_.65fr]"><div className="grid min-h-96 place-items-center rounded-2xl border-8 border-white bg-[linear-gradient(125deg,#9bb3bd_2%,#e9f0ee_2%_5%,#bdcfce_5%_8%,#f7f3df_8%_10%,#a8c0be_10%_14%,#e9eef0_14%)] shadow-inner"><div className="rounded-xl bg-[#002D62] px-5 py-3 text-center font-bold text-white shadow-xl">{project.name}<br /><span className="text-xs font-normal text-[#f8c366]">{project.location}</span>{project.settings.map_url && <a href={String(project.settings.map_url)} target="_blank" rel="noreferrer" className="mt-3 block text-xs underline">เปิด Google Maps</a>}</div></div><aside className="rounded-2xl bg-[#f5f7fa] p-6"><h3 className="font-extrabold text-[#002D62]">สถานที่ใกล้เคียง</h3><ul className="mt-4 space-y-3 text-sm text-slate-600">{landmarks.map((landmark) => <li key={landmark} className="border-b border-slate-200 pb-3">{landmark}</li>)}</ul></aside></div></div></section>
    <section id="register" className="container-page py-16 text-center"><h2 className="section-title">รับข้อเสนอพิเศษ</h2><p className="mt-3 text-slate-500">ลงทะเบียนเพื่อรับข้อมูลโครงการและนัดหมายเข้าชม</p>{project.settings.phone && <p className="mt-3 font-bold text-[#002D62]">โทร {project.settings.phone}</p>}{project.settings.email && <p className="mt-1 text-sm text-slate-500">{project.settings.email}</p>}<p className="mt-3 text-xs text-slate-400">* ราคาและรายละเอียดเป็นข้อมูลจำลอง โปรดตรวจสอบกับฝ่ายขายก่อนตัดสินใจ</p></section><LeadModal />
  </main>;
}
