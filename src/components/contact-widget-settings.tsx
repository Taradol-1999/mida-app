"use client";

import { Input } from "@/components/ui/form-controls";

export type ContactWidgetValues = { line: string; messenger: string; phone: string; email: string };

export function ContactWidgetSettings({
  value,
  onChange,
  scope = "เว็บไซต์ส่วนกลาง",
}: {
  value: ContactWidgetValues;
  onChange: (value: ContactWidgetValues) => void;
  scope?: string;
}) {
  return (
    <fieldset className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
      <legend className="sr-only">ช่องทางติดต่อ</legend>
      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-primary">
          <i className="fa-solid fa-comments" aria-hidden="true" />
        </span>
        <div>
          <h2 className="text-base font-bold text-slate-800">ช่องทางติดต่อ</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            ตั้งค่า LINE, Messenger เบอร์โทร และอีเมลที่แสดงบน{scope} ช่องทางที่ไม่ระบุจะไม่แสดงบนเว็บไซต์
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-brands fa-line text-brand-primary" aria-hidden="true" />
            ลิงก์ LINE
          </span>
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://line.me/..."
            value={value.line}
            onChange={(event) => onChange({ ...value, line: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-brands fa-facebook-messenger text-brand-primary" aria-hidden="true" />
            ลิงก์ Messenger
          </span>
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://m.me/..."
            value={value.messenger}
            onChange={(event) => onChange({ ...value, messenger: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-phone text-brand-primary" aria-hidden="true" />
            เบอร์โทรศัพท์
          </span>
          <Input
            type="tel"
            pattern="[0-9+()\s-]*"
            maxLength={30}
            value={value.phone}
            onChange={(event) => onChange({ ...value, phone: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-solid fa-envelope text-brand-primary" aria-hidden="true" />
            อีเมล
          </span>
          <Input
            type="email"
            maxLength={254}
            placeholder="contact@example.com"
            value={value.email}
            onChange={(event) => onChange({ ...value, email: event.target.value })}
          />
        </label>
      </div>
    </fieldset>
  );
}
