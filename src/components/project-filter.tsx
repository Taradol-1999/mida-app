"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

const projects = [
  { name: "มิดาเรนท์ แกรนด์ นครปฐม", location: "นครปฐม", type: "บ้านเดี่ยว", price: "4.59 - 8.90 ลบ.", status: "พร้อมอยู่", label: "RECOMMENDED" },
  { name: "ไมด้า ทาวน์ กำแพงแสน", location: "กำแพงแสน", type: "ทาวน์โฮม", price: "2.39 ลบ.", status: "พร้อมอยู่", label: "NEW" },
  { name: "ไมด้า บิสเนส อเวนิว กาญจนบุรี", location: "กาญจนบุรี", type: "อาคารพาณิชย์", price: "3.80 ลบ.", status: "กำลังก่อสร้าง", label: "HOT" },
];

export function ProjectFilter() {
  const [location, setLocation] = useState("ทั้งหมด");
  const [type, setType] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  const visible = useMemo(() => projects.filter((project) => (location === "ทั้งหมด" || project.location === location) && (type === "ทั้งหมด" || project.type === type) && (status === "ทั้งหมด" || project.status === status)), [location, type, status]);
  const selectStyle = "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 outline-none focus:border-[#002D62]";

  return <section id="projects" className="container-page -mt-10 relative z-10 pb-16">
    <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-900/10 md:p-7">
      <p className="mb-4 font-bold text-[#002D62]">ค้นหาโครงการที่เหมาะกับคุณ</p>
      <div className="grid gap-3 md:grid-cols-3">
        <select value={location} onChange={(event) => setLocation(event.target.value)} className={selectStyle}><option>ทั้งหมด</option><option>นครปฐม</option><option>กำแพงแสน</option><option>กาญจนบุรี</option></select>
        <select value={type} onChange={(event) => setType(event.target.value)} className={selectStyle}><option>ทั้งหมด</option><option>บ้านเดี่ยว</option><option>ทาวน์โฮม</option><option>อาคารพาณิชย์</option></select>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectStyle}><option>ทั้งหมด</option><option>พร้อมอยู่</option><option>กำลังก่อสร้าง</option></select>
      </div>
    </div>
    <div className="mt-14 flex items-end justify-between gap-4"><div><div className="gold-rule mb-3" /><h2 className="section-title">โครงการของ MIDA</h2><p className="mt-2 text-slate-500">เลือกบ้านที่ลงตัวกับทุกจังหวะชีวิต</p></div><span className="hidden text-sm text-slate-500 md:block">พบ {visible.length} โครงการ</span></div>
    <div className="mt-7 grid gap-5 md:grid-cols-3">
      {visible.map((project) => <article key={project.name} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg">
        <div className="relative h-48 bg-[linear-gradient(145deg,#c9d9e8,#597793)]"><span className="absolute left-4 top-4 rounded-md bg-[#F5A623] px-2.5 py-1 text-xs font-extrabold text-[#001B3D]">{project.label}</span><div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#001B3D]/70 to-transparent" /></div>
        <div className="p-5"><p className="text-xs font-bold text-[#F5A623]">{project.type} · {project.location}</p><h3 className="mt-2 min-h-14 text-xl font-extrabold text-[#002D62]">{project.name}</h3><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4"><div><p className="text-xs text-slate-400">ราคาเริ่มต้น</p><p className="font-extrabold text-[#002D62]">{project.price}</p></div><Link href="/projects/mida-grand-nakhon-pathom" className="button-primary text-sm">ดูโครงการ</Link></div></div>
      </article>)}
    </div>
    {!visible.length && <p className="mt-7 rounded-xl bg-white p-5 text-center text-slate-500">ไม่พบโครงการตามตัวกรองที่เลือก</p>}
  </section>;
}
