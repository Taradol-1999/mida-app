"use client";

import { Input, Select } from "@/components/ui/form-controls";

import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "@/components/language-provider";

export function LeadModal({ projectId, projectName, projectNameEn }: { projectId?: string | null; projectName?: string; projectNameEn?: string | null }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const { t } = useTranslation();

  useEffect(() => {
    const openModal = () => {
      setStatus("idle");
      setOpen(true);
    };
    window.addEventListener("mida:open-lead", openModal);
    return () => window.removeEventListener("mida:open-lead", openModal);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    setStatus(response.ok ? "success" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  return (
    <>
      <button
        onClick={() => {
          setStatus("idle");
          setOpen(true);
        }}
        className="fixed right-3 bottom-3 z-30 grid size-14 place-items-center rounded-full bg-brand-primary text-center text-[10px] font-bold text-white shadow-xl ring-4 ring-white hover:bg-brand-text sm:right-5 sm:bottom-5 sm:size-16 sm:text-xs"
        aria-label={t({ th: "นัดชมโครงการ", en: "Schedule a visit" })}
      >
        {t({ th: "นัดชม", en: "Book" })}
        <br />
        {t({ th: "โครงการ", en: "a visit" })}
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-brand-overlay/65 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t({ th: "นัดชมโครงการ", en: "Schedule a visit" })}
        >
          <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)]">
            <div className="relative shrink-0 overflow-hidden bg-brand-primary px-5 py-6 text-white shadow-md sm:px-8 sm:py-7">
              <span className="absolute -top-20 -right-10 size-52 rounded-full border-28 border-white/10" />
              <span className="absolute -bottom-24 right-36 size-40 rounded-full bg-brand-accent/20 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-accent text-xl text-brand-primary shadow-lg">
                    <i className="fa-solid fa-calendar-check" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-extrabold tracking-[0.16em] text-brand-accent">MIDA PROPERTY</p>
                    <h2 className="mt-1 text-xl font-extrabold sm:text-2xl">{t({ th: "ลงทะเบียนรับข้อเสนอพิเศษ", en: "Register for a Special Offer" })}</h2>
                    <p className="mt-1 text-sm text-white/75">
                      {projectName
                        ? t({ th: `สนใจโครงการ ${projectName}`, en: `Interested in ${projectNameEn || projectName}` })
                        : t({ th: "ให้เราช่วยแนะนำโครงการที่เหมาะกับคุณ", en: "Let us help you find the right project." })}
                    </p>
                  </div>
                </div>
                <button
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-white/10 text-lg text-white transition hover:bg-white/20"
                  onClick={() => setOpen(false)}
                  aria-label={t({ th: "ปิด", en: "Close" })}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </div>
            </div>
            {status === "success" ? (
              <div className="p-6 sm:p-10">
                <div className="mx-auto max-w-md rounded-2xl bg-emerald-50 p-7 text-center text-emerald-800">
                  <i className="fa-solid fa-circle-check text-4xl" aria-hidden="true" />
                  <p className="mt-3 font-bold">{t({ th: "ส่งข้อมูลเรียบร้อย", en: "Your information has been sent." })}</p>
                  <p className="mt-1 text-sm">{t({ th: "ขอบคุณที่สนใจโครงการ MIDA ทีมงานจะติดต่อกลับโดยเร็วที่สุด", en: "Thank you for your interest in MIDA. Our team will contact you shortly." })}</p>
                </div>
              </div>
            ) : (
              <form
                onSubmit={submit}
                className="scrollbar-mida min-h-0 flex-1 space-y-6 overflow-y-auto overscroll-contain p-5 sm:p-8"
              >
                {projectId && <Input type="hidden" name="projectId" value={projectId} />}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-brand-accent-soft text-sm text-brand-primary">
                      <i className="fa-solid fa-user" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-bold text-brand-primary">{t({ th: "ข้อมูลส่วนตัว", en: "Personal Information" })}</h3>
                      <p className="text-xs text-slate-500">{t({ th: "กรอกข้อมูลเพื่อให้ทีมงานติดต่อกลับ", en: "Please provide your details so our team can contact you." })}</p>
                    </div>
                  </div>
                  <fieldset>
                    <legend className="sr-only">{t({ th: "ข้อมูลส่วนตัว", en: "Personal Information" })}</legend>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Field label={t({ th: "ชื่อ", en: "First name" })} name="firstName" placeholder={t({ th: "ชื่อ", en: "First name" })} />
                      <Field label={t({ th: "นามสกุล", en: "Last name" })} name="lastName" placeholder={t({ th: "นามสกุล", en: "Last name" })} />
                      <Field label={t({ th: "อีเมล", en: "Email" })} name="email" type="email" placeholder={t({ th: "อีเมลของคุณ", en: "Your email" })} />
                      <Field label={t({ th: "เบอร์โทรศัพท์", en: "Phone" })} name="phone" type="tel" placeholder={t({ th: "เบอร์โทรศัพท์", en: "Phone number" })} />
                      <Field
                        label={t({ th: "จำนวนสมาชิกในครอบครัว", en: "Number of family members" })}
                        name="familyMembers"
                        type="number"
                        placeholder={t({ th: "จำนวนสมาชิก", en: "Number of members" })}
                      />
                    </div>
                  </fieldset>
                </div>

                <div className="rounded-2xl border border-slate-100 p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="grid size-8 place-items-center rounded-xl bg-brand-accent-soft text-sm text-brand-primary">
                      <i className="fa-solid fa-location-dot" aria-hidden="true" />
                    </span>
                    <h3 className="font-bold text-brand-primary">{t({ th: "ที่อยู่ปัจจุบัน", en: "Current Address" })}</h3>
                  </div>
                  <fieldset>
                    <legend className="sr-only">{t({ th: "ที่อยู่ปัจจุบัน", en: "Current Address" })}</legend>
                    <div className="grid gap-4 md:grid-cols-3">
                      <label className="text-sm font-semibold text-slate-700">
                        {t({ th: "จังหวัด", en: "Province" })} <span className="text-red-500">*</span>
                        <Input
                          name="province"
                          required
                          list="thai-provinces"
                          placeholder={t({ th: "เลือกหรือพิมพ์จังหวัด", en: "Select or type a province" })}
                          className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand-primary"
                        />
                        <datalist id="thai-provinces">
                          {[
                            "กรุงเทพมหานคร",
                            "นครปฐม",
                            "นนทบุรี",
                            "ปทุมธานี",
                            "สมุทรสาคร",
                            "สมุทรปราการ",
                            "ขอนแก่น",
                          ].map((province) => (
                            <option key={province} value={province} />
                          ))}
                        </datalist>
                      </label>
                      <Field label={t({ th: "เขต / อำเภอ", en: "District" })} name="district" placeholder={t({ th: "เขต / อำเภอ", en: "District" })} />
                      <Field label={t({ th: "ตำบล / แขวง", en: "Subdistrict" })} name="subdistrict" placeholder={t({ th: "ตำบล / แขวง", en: "Subdistrict" })} />
                    </div>
                  </fieldset>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <fieldset className="rounded-2xl border border-slate-100 p-4 sm:p-5">
                    <legend className="text-sm font-semibold text-slate-700">
                      {t({ th: "ประเภทที่อยู่อาศัยปัจจุบัน", en: "Current residence type" })} <span className="text-red-500">*</span>
                    </legend>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      {([
                        ["HOUSE", { th: "บ้าน", en: "House" }],
                        ["CONDO", { th: "คอนโดมิเนียม", en: "Condominium" }],
                        ["DORMITORY", { th: "อพาร์ทเม้น", en: "Apartment" }],
                      ] as const).map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2">
                          <Input
                            type="radio"
                            name="residenceType"
                            value={value}
                            required
                            className="accent-brand-primary"
                          />
                          {t(label)}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <div className="space-y-4 rounded-2xl border border-slate-100 p-4 sm:p-5">
                    <label className="block text-sm font-semibold text-slate-700">
                      {t({ th: "งบประมาณ", en: "Budget" })} <span className="text-red-500">*</span>
                      <Select
                        name="budget"
                        required
                        className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-slate-600"
                      >
                        <option value="">{t({ th: "เลือกงบประมาณ", en: "Select a budget" })}</option>
                        <option>{t({ th: "1-2 ล้านบาท", en: "THB 1–2 million" })}</option>
                        <option>{t({ th: "2-3 ล้านบาท", en: "THB 2–3 million" })}</option>
                        <option>{t({ th: "3-5 ล้านบาท", en: "THB 3–5 million" })}</option>
                        <option>{t({ th: "มากกว่า 5 ล้านบาท", en: "More than THB 5 million" })}</option>
                      </Select>
                    </label>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={t({ th: "วันที่สะดวกให้ติดต่อกลับ", en: "Preferred contact date" })} name="preferredContactDate" type="date" />
                      <Field label={t({ th: "ช่วงเวลาที่สะดวก", en: "Preferred contact time" })} name="preferredContactTime" type="time" />
                    </div>
                  </div>
                </div>

                <fieldset className="rounded-2xl border border-brand-accent/25 bg-brand-accent-soft/50 p-4 sm:p-5">
                  <legend className="px-1 text-sm font-semibold text-slate-700">{t({ th: "การรับข่าวสาร", en: "News Updates" })}</legend>
                  <div className="space-y-3 text-sm text-slate-600">
                    <label className="flex items-start gap-2">
                      <Input type="checkbox" name="consentNews" value="true" className="mt-1 accent-brand-primary" />
                      {t({ th: "ท่านต้องการรับข่าวสารจาก Mida Property", en: "I would like to receive news from MIDA Property." })}
                    </label>
                    <label className="flex items-start gap-2">
                      <Input
                        type="checkbox"
                        name="consentContact"
                        value="true"
                        required
                        className="mt-1 accent-brand-primary"
                      />
                      {t({ th: "ท่านยินยอมให้เจ้าหน้าที่ติดต่อกลับในช่วงเวลาที่ท่านกำหนด", en: "I consent to being contacted by a representative during my preferred time." })}
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                </fieldset>
                {status === "error" && <p className="text-sm text-red-600">{t({ th: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", en: "Unable to send your information. Please try again." })}</p>}
                <button
                  disabled={status === "sending"}
                  className="button-primary w-full py-3.5 text-base disabled:opacity-60"
                >
                  {status === "sending" ? t({ th: "กำลังส่ง...", en: "Sending..." }) : t({ th: "ยืนยันข้อมูล", en: "Submit information" })}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="text-sm font-semibold text-slate-700">
      {label} <span className="text-red-500">*</span>
      <Input
        name={name}
        type={type}
        required
        min={type === "number" ? 1 : undefined}
        max={type === "number" ? 99 : undefined}
        placeholder={placeholder}
        className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand-primary"
      />
    </label>
  );
}
