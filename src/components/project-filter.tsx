"use client";
/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { projects, type Project } from "@/data/projects";

const statusOptions = ["ทั้งหมด", "พร้อมอยู่", "กำลังก่อสร้าง"];
const typeOptions = ["ทั้งหมด", "บ้านเดี่ยว", "บ้านแฝด", "ทาวน์โฮม", "อาคารพาณิชย์"];
const selectStyle = "w-full bg-transparent text-xs text-slate-600 outline-none";

export function ProjectFilter() {
  const [catalogue, setCatalogue] = useState<Project[]>(projects);
  const [location, setLocation] = useState("ทั้งหมด");
  const [type, setType] = useState("ทั้งหมด");
  const [status, setStatus] = useState("ทั้งหมด");
  useEffect(() => {
    fetch("/api/projects")
      .then((response) => (response.ok ? response.json() : []))
      .then((data) => {
        if (Array.isArray(data)) setCatalogue(data);
      })
      .catch(() => undefined);
  }, []);
  const locations = useMemo(
    () => ["ทั้งหมด", ...Array.from(new Set(catalogue.map((project) => project.location)))],
    [catalogue],
  );
  const visible = useMemo(
    () =>
      catalogue.filter(
        (project) =>
          (location === "ทั้งหมด" || project.location === location) &&
          (type === "ทั้งหมด" || project.type === type) &&
          (status === "ทั้งหมด" || project.status === status),
      ),
    [catalogue, location, type, status],
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
          ค้นหาโครงการและระบบกรอง
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {filterBox(
            "fa-location-dot",
            "ทำเลที่ตั้ง",
            <select value={location} onChange={(event) => setLocation(event.target.value)} className={selectStyle}>
              {locations.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>,
          )}
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
            <p className="text-xs text-slate-500">เลือกดูโครงการตามราคาเริ่มต้น</p>,
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
            <p className="mt-2 text-sm text-slate-400">ข้อมูลโครงการดึงจากระบบจัดการหลังบ้าน MIDA</p>
          </div>
          <span className="rounded-full bg-[#002D62] px-4 py-2 text-xs font-bold text-white">
            พบ {visible.length} โครงการ
          </span>
        </div>
        <div className="mt-6 flex gap-2 overflow-x-auto pb-3">
          <span className="shrink-0 rounded-full bg-[#002D62] px-5 py-2.5 text-xs font-bold text-white">
            ✦ โครงการแนะนำ
          </span>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600">
            โครงการล่าสุด
          </span>
          <span className="shrink-0 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-600">
            พร้อมเข้าอยู่ได้ทันที
          </span>
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
              <span className="absolute left-4 top-4 rounded-md bg-red-500 px-3 py-1 text-[10px] font-black tracking-wider text-white shadow">
                {index === 0 ? "RECOMMENDED" : project.status === "พร้อมอยู่" ? "READY" : "NEW"}
              </span>
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#001B3D]/75 to-transparent" />
            </div>
            <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-bold text-[#002D62]">
                  {project.type}
                </span>
                <h3 className="mt-3 text-xl font-black tracking-tight text-slate-800">{project.name}</h3>
                <p className="mt-2 line-clamp-2 max-w-xl text-sm text-slate-400">{project.description}</p>
              </div>
              <div className="shrink-0 sm:text-right">
                <p className="text-[11px] text-slate-400">ราคาเริ่มต้น</p>
                <p className="text-lg font-black text-red-600">{project.price}</p>
                <Link
                  href={`/projects/${project.slug}`}
                  className="mt-3 inline-flex rounded-xl bg-[#002D62] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#001B3D]"
                >
                  ดูข้อมูลโครงการ <i className="fa-solid fa-arrow-right ml-2" />
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
