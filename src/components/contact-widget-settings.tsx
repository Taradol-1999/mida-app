"use client";

import { Input } from "@/components/ui/form-controls";

export type ContactWidgetValues = { line: string; messenger: string; phone: string; email: string };

export function ContactWidgetSettings({
  value,
  onChange,
}: {
  value: ContactWidgetValues;
  onChange: (value: ContactWidgetValues) => void;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
      <legend className="sr-only">ช่องทางติดต่อ</legend>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand-primary shadow-sm"><i className="fa-solid fa-comments" aria-hidden="true" /></span>
        <div>
          <h2 className="font-bold text-brand-primary">ช่องทางติดต่อ</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">ตั้งค่า LINE, Messenger เบอร์โทร และอีเมลที่แสดงบนเว็บไซต์ส่วนกลาง ช่องทางที่ไม่ระบุจะไม่แสดงบนเว็บไซต์</p>
        </div>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          ลิงก์ LINE
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://line.me/..."
            value={value.line}
            onChange={(event) => onChange({ ...value, line: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          ลิงก์ Messenger
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://m.me/..."
            value={value.messenger}
            onChange={(event) => onChange({ ...value, messenger: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          เบอร์โทรศัพท์
          <Input
            type="tel"
            pattern="[0-9+()\s-]*"
            maxLength={30}
            value={value.phone}
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          อีเมล
          <Input type="email" maxLength={254} placeholder="contact@example.com" value={value.email} onChange={(event) => onChange({ ...value, email: event.target.value })} />
        </label>
      </div>
    </fieldset>
  );
}
