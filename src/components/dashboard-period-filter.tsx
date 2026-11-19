"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/ui/form-controls";

export function DashboardPeriodFilter({
  month,
  year,
  months,
  years,
}: {
  month: number;
  year: number;
  months: string[];
  years: number[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: "month" | "year", value: string) {
    const next = new URLSearchParams(searchParams.toString());
    next.set(key, value);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  }

  return (
    <div
      className="flex h-11 items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
      aria-label="กรองข้อมูล Dashboard ตามเดือนและปี"
    >
      <label className="relative flex h-full min-w-28 items-center rounded-lg bg-slate-50 transition focus-within:bg-brand-soft">
        <span className="sr-only">เดือน</span>
        <i className="fa-regular fa-calendar absolute left-3 text-xs text-brand-primary" aria-hidden="true" />
        <Select
          variant="plain"
          value={String(month)}
          onChange={(event) => update("month", event.target.value)}
          className="h-full w-full cursor-pointer bg-transparent pl-8 pr-2 text-sm font-semibold text-slate-700 outline-none"
        >
          {months.map((label, index) => (
            <option key={label} value={index + 1}>
              {label}
            </option>
          ))}
        </Select>
      </label>
      <span className="h-5 w-px bg-slate-200" aria-hidden="true" />
      <label className="relative flex h-full min-w-24 items-center rounded-lg bg-slate-50 transition focus-within:bg-brand-soft">
        <span className="sr-only">ปี</span>
        <i className="fa-regular fa-calendar-check absolute left-3 text-xs text-brand-primary" aria-hidden="true" />
        <Select
          variant="plain"
          value={String(year)}
          onChange={(event) => update("year", event.target.value)}
          className="h-full w-full cursor-pointer bg-transparent pl-8 pr-2 text-sm font-semibold text-slate-700 outline-none"
        >
          {years.map((optionYear) => (
            <option key={optionYear} value={optionYear}>
              {optionYear + 543}
            </option>
          ))}
        </Select>
      </label>
    </div>
  );
}
