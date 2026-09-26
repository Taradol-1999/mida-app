"use client";

import { Input, Select } from "@/components/ui/form-controls";
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

export function ProjectFilter({
  projectIds,
  allProjectsHref,
  standalone = false,
}: {
  projectIds?: string[];
  allProjectsHref?: string;
  standalone?: boolean;
}) {
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
          (!projectIds || projectIds.includes(String(project.id))) &&
          (!keyword.trim() ||
            `${project.name} ${project.location} ${project.description}`
              .toLocaleLowerCase("th")
              .includes(keyword.trim().toLocaleLowerCase("th"))) &&
          (type === "ทั้งหมด" || project.type === type) &&
          matchesPrice(Number(project.startingPrice), priceRange) &&
          (status === "ทั้งหมด" || project.status === status) &&
          (tag === "all" || tagsOf(project).includes(tag)),
      ),
    [catalogue, keyword, priceRange, projectIds, status, tag, type],
  );
  const filterBox = (icon: string, label: string, child: ReactNode) => (
    <label className="flex min-h-18 flex-col justify-center rounded-lg border border-slate-200 bg-slate-50 p-3">
      <span className="mb-1 text-xs font-bold text-slate-700">
        <i className={`fa-solid ${icon} mr-1.5 text-brand-primary`} />
        {label}
      </span>
      {child}
    </label>
  );
  return (
    <section
      id="projects"
      className={`container-page relative z-10 ${standalone ? "py-12 sm:py-16" : "-mt-10 pb-12 sm:-mt-14 sm:pb-18"}`}
    >
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-900/10 sm:p-5 md:p-6">
        <p className="mb-4 text-sm font-bold text-brand-primary">
          <i className="fa-solid fa-magnifying-glass mr-2" />
          ค้นหาโครงการ
        </p>
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="ค้นหาชื่อโครงการหรือทำเล"
          className="mb-3 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-primary"
        />
        <div className="grid gap-3 sm:grid-cols-3">
          {filterBox(
            "fa-house",
            "ประเภทบ้าน",
            <Select
              variant="plain"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={selectStyle}
            >
              {typeOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>,
          )}
          {filterBox(
            "fa-baht-sign",
            "ช่วงราคา",
            <Select
              variant="plain"
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className={selectStyle}
            >
              {priceOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>,
          )}
          {filterBox(
            "fa-helmet-safety",
            "สถานะโครงการ",
            <Select
              variant="plain"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={selectStyle}
            >
              {statusOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </Select>,
          )}
        </div>
      </div>
      <div className="mt-10 sm:mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-brand-primary">
              <i className="fa-solid fa-city mr-2" />
              {projectIds ? "โครงการคัดสรร" : "โครงการทั้งหมด"}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-800 sm:text-3xl">
              เลือกบ้านที่ใช่สำหรับคุณ
            </h2>
            <p className="mt-2 text-sm text-slate-400">
              เลือกสไตล์ฟิลเตอร์เพื่อรับชมกลุ่มโครงการที่แมตช์กับไลฟ์สไตล์คุณ
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allProjectsHref && (
              <Link
                href={allProjectsHref}
                className="inline-flex items-center gap-2 rounded-full border border-brand-primary px-4 py-2 text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white"
              >
                ดูโครงการทั้งหมด <i className="fa-solid fa-arrow-right" />
              </Link>
            )}
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-3 pt-2">
          {tagOptions.map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setTag((current) => (current === label ? "all" : label))}
              className={`shrink-0 rounded-full px-5 py-2.5 text-xs font-bold transition ${tag === label ? "bg-brand-primary text-white shadow-sm ring-2 ring-brand-accent" : "border border-slate-200 bg-white text-slate-600 hover:border-brand-accent"}`}
            >
              {label === "โครงการแนะนำ" ? <span className="text-brand-accent">✦ </span> : ""}
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((project, index) => (
          <article
            key={project.slug}
            className={`group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_35px_rgba(0,45,98,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-brand-accent hover:shadow-[0_20px_45px_rgba(0,45,98,0.14)] ${index === 0 ? "xl:col-span-2" : ""}`}
          >
            <div className="project-card-cool relative h-52 overflow-hidden sm:h-60">
              {project.has_cover && project.id ? (
                <img
                  src={`/api/admin/media?entityType=projects&entityId=${project.id}`}
                  alt={`ภาพ ${project.name}`}
                  className="size-full object-cover transition duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="grid size-full place-items-center text-center text-white/85">
                  <div>
                    <span className="mx-auto grid size-16 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm">
                      <i className="fa-solid fa-house-chimney text-2xl" />
                    </span>
                    <p className="mt-3 text-xs font-bold">ภาพโครงการ</p>
                  </div>
                </div>
              )}
              <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
                {tagsOf(project).map((projectTag, tagIndex) => (
                  <span
                    key={projectTag}
                    className={`rounded-full px-3 py-1.5 text-[10px] font-black shadow-md backdrop-blur-sm ${tagIndex % 2 === 0 ? "bg-brand-primary/95 text-white" : "bg-brand-accent text-brand-primary"}`}
                  >
                    {projectTag}
                  </span>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-overlay/65 to-transparent" />
              <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-brand-overlay/65 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                <i className="fa-solid fa-location-dot mr-1.5 text-brand-accent" />
                {project.location}
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex rounded-full bg-brand-soft px-3 py-1.5 text-[10px] font-bold text-brand-primary">
                  <i className="fa-solid fa-house-chimney mr-1.5" />
                  {project.type}
                </span>
                <span
                  className={`inline-flex items-center text-[11px] font-semibold ${project.status === "พร้อมอยู่" ? "text-emerald-700" : "text-amber-700"}`}
                >
                  <i
                    className={`fa-solid ${project.status === "พร้อมอยู่" ? "fa-circle-check" : "fa-helmet-safety"} mr-1.5`}
                  />
                  {project.status}
                </span>
              </div>
              <div className="mt-4 h-0.5 w-12 rounded-full bg-brand-accent" />
              <div className="flex-1">
                <h3 className="mt-4 line-clamp-2 text-[1.35rem] leading-tight font-black tracking-tight text-slate-800">
                  {project.name}
                </h3>
                <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{project.description}</p>
              </div>
              <div className="mt-5 rounded-xl bg-brand-muted p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">ราคาเริ่มต้น</p>
                    <p className="mt-1 text-xl font-black text-brand-primary">{project.price}</p>
                  </div>
                  {project.has_brochure && project.id ? (
                    <a
                      href={`/api/admin/media?entityType=projects&entityId=${project.id}&mediaKind=brochure`}
                      download
                      className="inline-flex items-center rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-xs font-bold text-brand-primary transition hover:border-brand-accent hover:bg-brand-accent-soft"
                    >
                      <i className="fa-solid fa-file-arrow-down mr-2" />
                      โบรชัวร์
                    </a>
                  ) : null}
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href={`/projects/${project.slug}`}
                  className="inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-brand-primary px-5 py-3 text-center text-xs font-bold text-white transition hover:bg-brand-overlay"
                >
                  <span>ดูข้อมูลโครงการ</span>
                  <span className="grid size-7 place-items-center rounded-full bg-white/10">
                    <i className="fa-solid fa-arrow-right transition group-hover:translate-x-0.5" />
                  </span>
                </Link>
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
