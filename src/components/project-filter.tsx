"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { projects, type Project } from "@/data/projects";

const statusOptions = ["ทั้งหมด", "พร้อมอยู่", "กำลังก่อสร้าง"];
const typeOptions = ["ทั้งหมด", "บ้านเดี่ยว", "บ้านแฝด", "ทาวน์โฮม", "อาคารพาณิชย์"];
const priceOptions = [
  ["all", "ทุกช่วงราคา"],
  ["under-2m", "ไม่เกิน 2 ล้านบาท"],
  ["2m-3m", "2–3 ล้านบาท"],
  ["3m-4m", "3–4 ล้านบาท"],
  ["4m-5m", "4–5 ล้านบาท"],
  ["over-5m", "ตั้งแต่ 5 ล้านบาทขึ้นไป"],
] as const;
const selectStyle = "w-full bg-transparent text-xs text-slate-600 outline-none";

function matchesPrice(startingPrice: number, range: string) {
  if (range === "under-2m") return startingPrice < 2_000_000;
  if (range === "2m-3m") return startingPrice >= 2_000_000 && startingPrice < 3_000_000;
  if (range === "3m-4m") return startingPrice >= 3_000_000 && startingPrice < 4_000_000;
  if (range === "4m-5m") return startingPrice >= 4_000_000 && startingPrice < 5_000_000;
  if (range === "over-5m") return startingPrice >= 5_000_000;
  return true;
}

function tagsOf(project: Project) {
  if (Array.isArray(project.tags)) return project.tags;
  try {
    const tags = JSON.parse(String(project.tags ?? "[]"));
    return Array.isArray(tags) ? tags.map(String) : [];
  } catch {
    return String(project.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

const preferredTagOrder = ["โครงการแนะนำ", "โครงการล่าสุด", "พร้อมเข้าอยู่ได้ทันที"];

export function ProjectFilter() {
  const [catalogue, setCatalogue] = useState<Project[]>(projects);
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState("ทั้งหมด");
  const [priceRange, setPriceRange] = useState("all");
  const [status, setStatus] = useState("ทั้งหมด");
  const [tag, setTag] = useState("all");
  useEffect(() => {
    fetch("/api/projects")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCatalogue(data);
      })
      .catch(() => undefined);
  }, []);
  const tagOptions = useMemo(
    () =>
      Array.from(new Set(catalogue.flatMap(tagsOf)))
        .filter((item) => preferredTagOrder.includes(item))
        .sort((a, b) => {
          const aIndex = preferredTagOrder.indexOf(a);
          const bIndex = preferredTagOrder.indexOf(b);
          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b, "th");
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        }),
    [catalogue],
  );
  const visible = useMemo(
    () =>
      catalogue.filter(
        (project) =>
          (!keyword.trim() ||
            `${project.name} ${project.location} ${project.description}`
              .toLocaleLowerCase("th")
              .includes(keyword.trim().toLocaleLowerCase("th"))) &&
          (type === "ทั้งหมด" || project.type === type) &&
          matchesPrice(Number(project.startingPrice), priceRange) &&
          (status === "ทั้งหมด" || project.status === status) &&
          (tag === "all" || tagsOf(project).includes(tag)),
      ),
    [catalogue, keyword, priceRange, status, tag, type],
  );
  const filterBox = (icon: string, label: string, child: ReactNode) => (
    <label className="flex min-h-18 flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="mb-1 text-xs font-bold text-slate-700">
        <i className={`fa-solid ${icon} mr-1.5 text-[#002D62]`} />
        {label}
      </span>
      {child}
    </label>
  );
  return (
    <section id="projects" className="container-page relative z-10 -mt-14 pb-18">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xl shadow-slate-900/10 md:p-6">
        <p className="mb-4 text-sm font-bold text-[#002D62]">
          <i className="fa-solid fa-magnifying-glass mr-2" />
          ค้นหาโครงการ
        </p>
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="ค้นหาชื่อโครงการหรือทำเล"
          className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-[#002D62]"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {filterBox(
            "fa-house",
            "ประเภทบ้าน",
            <select value={type} onChange={(event) => setType(event.target.value)} className={selectStyle}>
              {typeOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>,
          )}
          {filterBox(
            "fa-baht-sign",
            "ช่วงราคา",
            <select value={priceRange} onChange={(event) => setPriceRange(event.target.value)} className={selectStyle}>
              {priceOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>,
          )}
          {filterBox(
            "fa-helmet-safety",
            "สถานะโครงการ",
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={selectStyle}>
              {statusOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>,
          )}
        </div>
      </div>
      <div className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-[#002D62]">
              <i className="fa-solid fa-city mr-2" />
              โครงการทั้งหมด
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-800">เลือกบ้านที่ใช่สำหรับคุณ</h2>
            <p className="mt-2 text-sm text-slate-400">
              เลือกสไตล์ฟิลเตอร์เพื่อรับชมกลุ่มโครงการที่แมตช์กับไลฟ์สไตล์คุณ
            </p>
          </div>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-3">
          {tagOptions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setTag((current) => (current === label ? "all" : label))}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${tag === label ? "bg-[#002D62] text-white shadow-sm" : "border border-slate-200 bg-white text-slate-600 hover:border-[#002D62]"}`}
            >
              {label === "โครงการแนะนำ" ? "✦ " : ""}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((project, index) => (
          <article
            key={project.slug}
            className={`group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "xl:col-span-2" : ""}`}
          >
            <div
              className={`relative h-60 overflow-hidden ${index % 2 ? "bg-[linear-gradient(145deg,#dae8dd,#708f7e)]" : "bg-[linear-gradient(145deg,#c9d9e8,#597793)]"}`}
            >
              {project.has_cover && project.id ? (
                <img
                  src={`/api/admin/media?entityType=projects&entityId=${project.id}`}
                  alt={`ภาพ ${project.name}`}
                  className="size-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center text-sm font-bold text-white/80">
                  <i className="fa-solid fa-house-chimney text-4xl" />
                </div>
              )}
              <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                {tagsOf(project).map((projectTag, tagIndex) => (
                  <span
                    key={projectTag}
                    className={`rounded-md px-3 py-1 text-[10px] font-black shadow ${tagIndex % 2 === 0 ? "bg-[#002D62] text-white" : "bg-white text-[#002D62]"}`}
                  >
                    {projectTag}
                  </span>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-[#002D62]/75 to-transparent" />
            </div>
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-[#002D62]">
                  {project.type}
                </span>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-800">{project.name}</h3>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm text-slate-400">{project.description}</p>
              </div>
              <div className="shrink-0 sm:text-right space-x-2">
                <p className="text-[11px] text-slate-400">ราคาเริ่มต้น</p>
                <p className="text-lg font-black text-[#002D62]">{project.price}</p>
                <Link
                  href={`/projects/${project.slug}`}
                  className="mt-3 inline-flex rounded-xl bg-[#002D62] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#4A4A4A]"
                >
                  ดูข้อมูลโครงการ <i className="fa-solid fa-arrow-right ml-2" />
                </Link>
                {project.has_brochure && project.id ? (
                  <a
                    href={`/api/admin/media?entityType=projects&entityId=${project.id}&mediaKind=brochure`}
                    download
                    className="mt-2 inline-flex rounded-xl border border-[#002D62] px-4 py-2.5 text-xs font-bold text-[#002D62] hover:bg-blue-50"
                  >
                    <i className="fa-solid fa-file-arrow-down mr-1" />
                    โบรชัวร์
                  </a>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
      {!visible.length && (
        <p className="mt-7 rounded-xl bg-white p-5 text-center text-slate-500">ไม่พบโครงการตามตัวกรองที่เลือก</p>
      )}
    </section>
  );
}
