"use client";

import { Input, Select } from "@/components/ui/form-controls";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { projects, type Project } from "@/data/projects";
import { useTranslation } from "@/components/language-provider";

const statusOptions = [
  ["ทั้งหมด", { th: "ทั้งหมด", en: "All statuses" }],
  ["พร้อมอยู่", { th: "พร้อมอยู่", en: "Ready to move in" }],
  ["กำลังก่อสร้าง", { th: "กำลังก่อสร้าง", en: "Under construction" }],
] as const;
const typeOptions = [
  ["ทั้งหมด", { th: "ทั้งหมด", en: "All types" }],
  ["บ้านเดี่ยว", { th: "บ้านเดี่ยว", en: "Detached house" }],
  ["บ้านแฝด", { th: "บ้านแฝด", en: "Semi-detached house" }],
  ["ทาวน์โฮม", { th: "ทาวน์โฮม", en: "Townhome" }],
  ["อาคารพาณิชย์", { th: "อาคารพาณิชย์", en: "Commercial building" }],
] as const;
const priceOptions = [
  ["all", { th: "ทุกช่วงราคา", en: "All price ranges" }],
  ["under-2m", { th: "ไม่เกิน 2 ล้านบาท", en: "Up to THB 2 million" }],
  ["2m-3m", { th: "2–3 ล้านบาท", en: "THB 2–3 million" }],
  ["3m-4m", { th: "3–4 ล้านบาท", en: "THB 3–4 million" }],
  ["4m-5m", { th: "4–5 ล้านบาท", en: "THB 4–5 million" }],
  ["over-5m", { th: "ตั้งแต่ 5 ล้านบาทขึ้นไป", en: "THB 5 million and above" }],
] as const;
const selectStyle = "w-full bg-transparent text-base text-slate-600 outline-none sm:text-sm";

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
const tagLabels: Record<string, { th: string; en: string }> = {
  โครงการแนะนำ: { th: "โครงการแนะนำ", en: "Recommended" },
  โครงการล่าสุด: { th: "โครงการล่าสุด", en: "New project" },
  พร้อมเข้าอยู่ได้ทันที: { th: "พร้อมเข้าอยู่ได้ทันที", en: "Ready to move in" },
};
const propertyTypeLabels: Record<Project["type"], { th: string; en: string }> = {
  บ้านเดี่ยว: { th: "บ้านเดี่ยว", en: "Detached house" },
  บ้านแฝด: { th: "บ้านแฝด", en: "Semi-detached house" },
  ทาวน์โฮม: { th: "ทาวน์โฮม", en: "Townhome" },
  อาคารพาณิชย์: { th: "อาคารพาณิชย์", en: "Commercial building" },
};
const statusLabels: Record<Project["status"], { th: string; en: string }> = {
  พร้อมอยู่: { th: "พร้อมอยู่", en: "Ready to move in" },
  กำลังก่อสร้าง: { th: "กำลังก่อสร้าง", en: "Under construction" },
};

export function ProjectFilter({
  projectIds,
  allProjectsHref,
  standalone = false,
  initialType,
}: {
  projectIds?: string[];
  allProjectsHref?: string;
  standalone?: boolean;
  initialType?: string;
}) {
  const { language, t } = useTranslation();
  const [catalogue, setCatalogue] = useState<Project[]>(projects);
  const [hasLoadedCatalogue, setHasLoadedCatalogue] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [address, setAddress] = useState("all");
  const [type, setType] = useState(typeOptions.some(([value]) => value === initialType) ? initialType! : "ทั้งหมด");
  const [priceRange, setPriceRange] = useState("all");
  const [status, setStatus] = useState("ทั้งหมด");
  const [tag, setTag] = useState("all");
  const cardsRef = useRef<HTMLDivElement>(null);
  const moveCards = (direction: -1 | 1) => {
    const track = cardsRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    track.scrollBy({ left: direction * ((card?.offsetWidth ?? track.clientWidth) + 20), behavior: "smooth" });
  };
  useEffect(() => {
    fetch("/api/projects")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setCatalogue(data);
          setHasLoadedCatalogue(true);
        }
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
  const addressOptions = useMemo(() => {
    const provinces = new Map<string, string>();
    const districts = new Map<string, string>();
    for (const project of catalogue) {
      const province = project.province?.trim() || project.location?.trim();
      const district = project.district?.trim();
      if (province) provinces.set(`province:${province}`, province);
      if (province && district) districts.set(`district:${province}:${district}`, `${province}, ${district}`);
    }
    return [...provinces, ...districts].map(([value, label]) => ({ value, label }));
  }, [catalogue]);
  const addressMatches = useCallback(
    (project: Project) => {
      if (address === "all") return true;
      const [level, province, district] = address.split(":");
      const projectProvince = project.province || project.location;
      if (level === "province") return projectProvince === province;
      return projectProvince === province && project.district === district;
    },
    [address],
  );
  const visible = useMemo(
    () =>
      catalogue.filter(
        (project) =>
          // The bundled catalogue has no database IDs. Keep cards visible while
          // the public catalogue is loading, then apply the curated selection.
          (!hasLoadedCatalogue || !projectIds || projectIds.includes(String(project.id))) &&
          (!keyword.trim() ||
            `${project.name} ${project.name_en ?? ""} ${project.location} ${project.location_en ?? ""} ${project.province ?? ""} ${project.district ?? ""} ${project.description}`
              .toLocaleLowerCase("th")
              .includes(keyword.trim().toLocaleLowerCase("th"))) &&
          addressMatches(project) &&
          (type === "ทั้งหมด" || project.type === type) &&
          matchesPrice(Number(project.startingPrice), priceRange) &&
          (status === "ทั้งหมด" || project.status === status) &&
          (tag === "all" || tagsOf(project).includes(tag)),
      ),
    [addressMatches, catalogue, hasLoadedCatalogue, keyword, priceRange, projectIds, status, tag, type],
  );
  const filterBox = (icon: string, label: string, child: ReactNode) => (
    <label className="flex min-h-18 flex-col justify-center rounded-lg border border-slate-200 bg-filter-surface p-3">
      <span className="mb-1 text-xs font-bold text-slate-700">
        <i className={`fa-solid ${icon} mr-1.5 text-brand-primary`} />
        {label}
      </span>
      {child}
    </label>
  );
  const projectText = (project: Project, field: "name" | "location" | "description") => {
    const englishField = `${field}_en` as "name_en" | "location_en" | "description_en";
    return language === "en" && project[englishField] ? String(project[englishField]) : project[field];
  };
  return (
    <section
      id="projects"
      className={`container-page relative z-10 ${standalone ? "pb-12 pt-6 sm:pb-16 sm:pt-8" : "-mt-10 pb-12 sm:-mt-16 sm:pb-18"}`}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-project-filter sm:p-5 md:p-6">
        <div className="relative mb-3">
          <i
            className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary"
            aria-hidden="true"
          />
          <Input
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder={t({ th: "ค้นหาชื่อโครงการหรือทำเล", en: "Search by project or location" })}
            className="w-full rounded-lg border border-slate-200 bg-filter-surface py-3 pl-11 pr-4 text-base outline-none focus:border-brand-primary sm:text-sm"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          {filterBox(
            "fa-location-dot",
            t({ th: "จังหวัด / อำเภอ", en: "Province / District" }),
            <Select
              variant="plain"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className={selectStyle}
            >
              <option value="all">{t({ th: "ทุกทำเล", en: "All locations" })}</option>
              {addressOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>,
          )}
          {filterBox(
            "fa-house",
            t({ th: "ประเภทบ้าน", en: "Property type" }),
            <Select
              variant="plain"
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={selectStyle}
            >
              {typeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </Select>,
          )}
          {filterBox(
            "fa-baht-sign",
            t({ th: "ช่วงราคา", en: "Price range" }),
            <Select
              variant="plain"
              value={priceRange}
              onChange={(event) => setPriceRange(event.target.value)}
              className={selectStyle}
            >
              {priceOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </Select>,
          )}
          {filterBox(
            "fa-helmet-safety",
            t({ th: "สถานะโครงการ", en: "Project status" }),
            <Select
              variant="plain"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              className={selectStyle}
            >
              {statusOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {t(label)}
                </option>
              ))}
            </Select>,
          )}
        </div>
      </div>
      <div className="mt-12 sm:mt-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            {standalone && (
              <p className="text-xs font-bold text-brand-primary">
                <i className="fa-solid fa-city mr-2" />
                {projectIds
                  ? t({ th: "โครงการคัดสรร", en: "Featured projects" })
                  : t({ th: "โครงการทั้งหมด", en: "All projects" })}
              </p>
            )}
            <h2 className="mt-2 text-2xl font-black tracking-tight text-brand-primary sm:text-3xl lg:text-4xl">
              {!standalone && <i className="fa-solid fa-house mr-3 text-brand-primary" aria-hidden="true" />}
              {t({ th: "เลือกบ้านที่ใช่สำหรับคุณ", en: "Find the home that fits you" })}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {t({
                th: "เลือกสไตล์ฟิลเตอร์เพื่อรับชมกลุ่มโครงการที่แมตช์กับไลฟ์สไตล์คุณ",
                en: "Filter projects to match your lifestyle.",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {allProjectsHref && (
              <Link
                href={allProjectsHref}
                className="inline-flex min-h-11 items-center gap-4 rounded-full bg-action-cyan py-1.5 pl-5 pr-1.5 text-xs font-bold text-white shadow-action transition hover:bg-brand-primary"
              >
                {t({ th: "ดูโครงการทั้งหมด", en: "View all projects" })}{" "}
                <span className="grid size-8 place-items-center rounded-full bg-white text-action-ink">
                  <i className="fa-solid fa-arrow-right" />
                </span>
              </Link>
            )}
          </div>
        </div>
        {tagOptions.length > 0 && (
          <div className="mt-4 flex gap-2 overflow-x-auto pt-2 pb-2">
            {tagOptions.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => setTag((current) => (current === label ? "all" : label))}
                aria-pressed={tag === label}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent ${tag === label ? "bg-brand-primary text-white shadow-sm ring-2 ring-brand-accent" : "border border-slate-200 bg-white text-slate-600 hover:border-brand-accent"}`}
              >
                <i
                  className={`fa-solid ${
                    label === "โครงการแนะนำ" ? "fa-star" : label === "โครงการล่าสุด" ? "fa-calendar-plus" : "fa-key"
                  } text-brand-accent`}
                  aria-hidden="true"
                />
                {t(tagLabels[label] ?? { th: label, en: label })}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="relative">
        <div
          ref={cardsRef}
          className={
            standalone
              ? "grid items-stretch gap-6 md:grid-cols-2 xl:grid-cols-3"
              : "flex snap-x snap-mandatory items-stretch gap-5 overflow-x-auto pb-5 scrollbar-none sm:gap-6 [&::-webkit-scrollbar]:hidden"
          }
        >
          {visible.map((project) => (
            <article
              key={project.slug}
              className={`group mt-5 flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-project-card transition duration-300 hover:-translate-y-1.5 hover:border-brand-accent hover:shadow-project-card-hover ${standalone ? "" : "min-w-[86%] snap-start sm:min-w-[47%] lg:min-w-[calc(33.333%-1rem)]"}`}
            >
              <div className="project-card-cool relative h-56 overflow-hidden rounded-xl sm:h-64 lg:h-72">
                {project.has_cover && project.id ? (
                  <img
                    src={`/api/admin/media?entityType=projects&entityId=${project.id}`}
                    alt={`${t({ th: "ภาพ", en: "Image" })} ${projectText(project, "name")}`}
                    className="size-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="grid size-full place-items-center text-center text-white/85">
                    <div>
                      <span className="mx-auto grid size-16 place-items-center rounded-full border border-white/30 bg-white/15 backdrop-blur-sm">
                        <i className="fa-solid fa-house-chimney text-2xl" />
                      </span>
                      <p className="mt-3 text-xs font-bold">{t({ th: "ภาพโครงการ", en: "Project image" })}</p>
                    </div>
                  </div>
                )}
                <div className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
                  {tagsOf(project).map((projectTag) => (
                    <span
                      key={projectTag}
                      className="rounded-full bg-brand-accent px-3 py-1.5 text-[10px] font-normal text-white shadow-md backdrop-blur-sm"
                    >
                      {t(tagLabels[projectTag] ?? { th: projectTag, en: projectTag })}
                    </span>
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-brand-overlay/65 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-full border border-white/30 bg-brand-overlay/65 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                  <i className="fa-solid fa-location-dot mr-1.5 text-brand-accent" />
                  {projectText(project, "location")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex-1">
                  <h3 className="mt-3 line-clamp-2 break-words text-lg leading-snug font-black tracking-tight text-brand-primary sm:mt-4 sm:text-[1.35rem]">
                    {projectText(project, "name")}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">
                    {projectText(project, "description")}
                  </p>
                </div>
                <div className="mt-5 rounded-xl bg-brand-muted p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                        {t({ th: "ราคาเริ่มต้น", en: "Starting price" })}
                      </p>
                      <p className="mt-1 text-xl font-black text-brand-primary">
                        {language === "en"
                          ? `THB ${(Number(project.startingPrice) / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 3 })} million`
                          : project.price}
                      </p>
                    </div>
                    {project.has_brochure && project.id ? (
                      <a
                        href={`/api/admin/media?entityType=projects&entityId=${project.id}&mediaKind=brochure`}
                        download
                        className="inline-flex items-center rounded-lg border border-brand-primary/20 bg-white px-3 py-2 text-xs font-bold text-brand-primary transition hover:border-brand-accent hover:bg-brand-accent-soft"
                      >
                        <i className="fa-solid fa-file-arrow-down mr-2" />
                        {t({ th: "โบรชัวร์", en: "Brochure" })}
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/projects/${project.slug}`}
                    className="inline-flex min-h-12 w-full items-center justify-between rounded-xl bg-brand-primary px-5 py-3 text-center text-xs font-bold text-white transition hover:bg-brand-overlay"
                  >
                    <span>{t({ th: "ดูข้อมูลโครงการ", en: "View project" })}</span>
                    <span className="grid size-7 place-items-center rounded-full bg-white/10">
                      <i className="fa-solid fa-arrow-right transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!standalone && visible.length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 top-24 flex justify-between sm:top-28 lg:top-32">
            <button
              type="button"
              onClick={() => moveCards(-1)}
              aria-label={t({ th: "โครงการก่อนหน้า", en: "Previous project" })}
              className="pointer-events-auto -ml-2 grid size-11 place-items-center rounded-full bg-white text-brand-primary shadow-lg transition hover:bg-brand-primary hover:text-white sm:-ml-5"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => moveCards(1)}
              aria-label={t({ th: "โครงการถัดไป", en: "Next project" })}
              className="pointer-events-auto -mr-2 grid size-11 place-items-center rounded-full bg-brand-primary text-white shadow-lg transition hover:bg-white hover:text-brand-primary sm:-mr-5"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
      {!visible.length && (
        <p className="mt-7 rounded-xl bg-white p-5 text-center text-slate-500">
          {t({ th: "ไม่พบโครงการตามตัวกรองที่เลือก", en: "No projects match your filters." })}
        </p>
      )}
    </section>
  );
}
