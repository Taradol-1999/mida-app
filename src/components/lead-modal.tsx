"use client";

import { FormEvent, useEffect, useState } from "react";

export function LeadModal({ projectId, projectName }: { projectId?: string | null; projectName?: string }) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

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
        className="fixed bottom-5 right-5 z-30 grid size-16 place-items-center rounded-full bg-brand-primary text-center text-xs font-bold text-white shadow-xl ring-4 ring-white hover:bg-brand-text"
        aria-label="นัดชมโครงการ"
      >
        นัดชม
        <br />
        โครงการ
      </button>
      {open && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-brand-overlay/65 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="นัดชมโครงการ"
        >
          <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-brand-text">MIDA PROPERTY</p>
                <h2 className="text-2xl font-extrabold text-brand-primary">ลงทะเบียนรับข้อเสนอพิเศษ</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {projectName ? `โครงการ ${projectName}` : "ทีมงานจะติดต่อกลับโดยเร็วที่สุด"}
                </p>
              </div>
              <button className="text-2xl text-slate-400" onClick={() => setOpen(false)} aria-label="ปิด">
                ×
              </button>
            </div>
            {status === "success" ? (
              <div className="rounded-xl bg-emerald-50 p-5 text-emerald-800">
                <p className="font-bold">ส่งข้อมูลเรียบร้อย</p>
                <p className="mt-1 text-sm">ขอบคุณที่สนใจโครงการ MIDA</p>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-7">
                {projectId && <input type="hidden" name="projectId" value={projectId} />}
                <fieldset>
                  <legend className="mb-4 w-full border-b border-slate-100 pb-3 text-center font-bold text-brand-primary">
                    ข้อมูลส่วนตัว
                  </legend>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Field label="ชื่อ" name="firstName" placeholder="ชื่อ" />
                    <Field label="นามสกุล" name="lastName" placeholder="นามสกุล" />
                    <Field label="อีเมล" name="email" type="email" placeholder="อีเมลของคุณ" />
                    <Field label="เบอร์โทรศัพท์" name="phone" type="tel" placeholder="เบอร์โทรศัพท์" />
                    <Field label="จำนวนสมาชิกในครอบครัว" name="familyMembers" type="number" placeholder="จำนวนสมาชิก" />
                  </div>
                </fieldset>

                <fieldset>
                  <legend className="mb-4 w-full border-b border-slate-100 pb-3 text-center font-bold text-brand-primary">
                    ที่อยู่ปัจจุบัน
                  </legend>
                  <div className="grid gap-4 md:grid-cols-3">
                    <label className="text-sm font-semibold text-slate-700">
                      จังหวัด <span className="text-red-500">*</span>
                      <input
                        name="province"
                        required
                        list="thai-provinces"
                        placeholder="เลือกหรือพิมพ์จังหวัด"
                        className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-brand-primary"
                      />
                      <datalist id="thai-provinces">
                        {["กรุงเทพมหานคร", "นครปฐม", "นนทบุรี", "ปทุมธานี", "สมุทรสาคร", "สมุทรปราการ", "ขอนแก่น"].map(
                          (province) => (
                            <option key={province} value={province} />
                          ),
                        )}
                      </datalist>
                    </label>
                    <Field label="เขต / อำเภอ" name="district" placeholder="เขต / อำเภอ" />
                    <Field label="ตำบล / แขวง" name="subdistrict" placeholder="ตำบล / แขวง" />
                  </div>
                </fieldset>

                <div className="grid gap-6 md:grid-cols-2">
                  <fieldset>
                    <legend className="text-sm font-semibold text-slate-700">
                      ประเภทที่อยู่อาศัยปัจจุบัน <span className="text-red-500">*</span>
                    </legend>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                      {[
                        ["HOUSE", "บ้าน"],
                        ["CONDO", "คอนโดมิเนียม"],
                        ["DORMITORY", "อพาร์ทเม้น"],
                      ].map(([value, label]) => (
                        <label key={value} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="residenceType"
                            value={value}
                            required
                            className="accent-brand-primary"
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  <label className="text-sm font-semibold text-slate-700">
                    งบประมาณ <span className="text-red-500">*</span>
                    <select
                      name="budget"
                      required
                      className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 text-slate-600"
                    >
                      <option value="">เลือกงบประมาณ</option>
                      <option>1-2 ล้านบาท</option>
                      <option>2-3 ล้านบาท</option>
                      <option>3-5 ล้านบาท</option>
                      <option>มากกว่า 5 ล้านบาท</option>
                    </select>
                  </label>
                  <Field label="วันที่สะดวกให้ติดต่อกลับ" name="preferredContactDate" type="date" />
                  <Field label="ช่วงเวลาที่สะดวก" name="preferredContactTime" type="time" />
                </div>

                <fieldset className="rounded-xl bg-slate-50 p-4">
                  <legend className="px-1 text-sm font-semibold text-slate-700">การรับข่าวสาร</legend>
                  <div className="space-y-3 text-sm text-slate-600">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" name="consentNews" value="true" className="mt-1 accent-brand-primary" />
                      ท่านต้องการรับข่าวสารจาก Mida Property
                    </label>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        name="consentContact"
                        value="true"
                        required
                        className="mt-1 accent-brand-primary"
                      />
                      ท่านยินยอมให้เจ้าหน้าที่ติดต่อกลับในช่วงเวลาที่ท่านกำหนด
                      <span className="text-red-500">*</span>
                    </label>
                  </div>
                </fieldset>
                {status === "error" && <p className="text-sm text-red-600">ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>}
                <button disabled={status === "sending"} className="button-primary w-full disabled:opacity-60">
                  {status === "sending" ? "กำลังส่ง..." : "ยืนยันข้อมูล"}
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
      <input
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
