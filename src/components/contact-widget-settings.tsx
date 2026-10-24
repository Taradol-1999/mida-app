"use client";

import { Input } from "@/components/ui/form-controls";
import { contactChannels, defaultWidgetChannels, type WidgetChannels } from "@/lib/contact-widget-options";

export type ContactWidgetValues = {
  line: string;
  messenger: string;
  tiktok: string;
  youtube: string;
  phone: string;
  email: string;
  widgetChannels: WidgetChannels;
};
const channelLabels = {
  line: "LINE",
  messenger: "Messenger",
  tiktok: "TikTok",
  youtube: "YouTube",
  phone: "โทรศัพท์",
  email: "อีเมล",
};

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
            ตั้งค่าช่องทางติดต่อบน{scope} และเลือกช่องทางที่ต้องการแสดงในปุ่มติดต่อมุมขวาล่าง
            ช่องทางที่ไม่ระบุข้อมูลจะไม่แสดง
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-x-6 gap-y-4 md:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-brands fa-youtube text-brand-primary" aria-hidden="true" />
            ลิงก์ YouTube
          </span>
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://www.youtube.com/@..."
            maxLength={2000}
            value={value.youtube}
            onChange={(event) => onChange({ ...value, youtube: event.target.value })}
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          <span className="inline-flex items-center gap-2">
            <i className="fa-brands fa-tiktok text-brand-primary" aria-hidden="true" />
            ลิงก์ TikTok
          </span>
          <Input
            type="url"
            pattern="https://.+"
            placeholder="https://www.tiktok.com/@..."
            maxLength={2000}
            value={value.tiktok}
            onChange={(event) => onChange({ ...value, tiktok: event.target.value })}
          />
        </label>
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
      <fieldset className="mt-6 rounded-xl border border-slate-200 p-4">
        <legend className="px-2 text-sm font-semibold text-slate-700">แสดงในปุ่มติดต่อมุมขวาล่าง</legend>
        <p className="mb-3 text-xs leading-5 text-slate-500">
          เลือกเฉพาะช่องทางที่ต้องการแสดง การปิดจะไม่ลบลิงก์หรือซ่อนจาก Footer
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {contactChannels.map((channel) => (
            <label
              key={channel}
              className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <input
                type="checkbox"
                className="size-4 accent-brand-primary"
                checked={value.widgetChannels?.[channel] ?? true}
                onChange={(event) =>
                  onChange({
                    ...value,
                    widgetChannels: {
                      ...defaultWidgetChannels,
                      ...value.widgetChannels,
                      [channel]: event.target.checked,
                    },
                  })
                }
              />
              {channelLabels[channel]}
            </label>
          ))}
        </div>
      </fieldset>
    </fieldset>
  );
}
