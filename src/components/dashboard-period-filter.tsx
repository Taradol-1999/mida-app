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
    <div className="flex items-center gap-2" aria-label="กรองข้อมูล Dashboard ตามเดือนและปี">
      <Select
        value={String(month)}
        onChange={(event) => update("month", event.target.value)}
        className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
      >
        {months.map((label, index) => (
          <option key={label} value={index + 1}>
            {label}
          </option>
        ))}
      </Select>
      <Select
        value={String(year)}
        onChange={(event) => update("year", event.target.value)}
        className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700"
      >
        {years.map((optionYear) => (
          <option key={optionYear} value={optionYear}>
            {optionYear + 543}
          </option>
        ))}
      </Select>
    </div>
  );
}
