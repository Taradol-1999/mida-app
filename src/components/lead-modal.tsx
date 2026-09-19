"use client";

import { FormEvent, useState } from "react";

export function LeadModal() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(form)) });
    setStatus(response.ok ? "success" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  return <>
    <button onClick={() => { setStatus("idle"); setOpen(true); }} className="fixed bottom-5 right-5 z-30 grid size-16 place-items-center rounded-full bg-[#002D62] text-center text-xs font-bold text-white shadow-xl ring-4 ring-white hover:bg-[#001B3D]" aria-label="นัดชมโครงการ">นัดชม<br />โครงการ</button>
    {open && <div className="fixed inset-0 z-40 grid place-items-center bg-[#001b3d]/65 p-4" role="dialog" aria-modal="true" aria-label="นัดชมโครงการ">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between"><div><p className="text-sm font-bold text-[#F5A623]">MIDA PROPERTY</p><h2 className="text-2xl font-extrabold text-[#002D62]">นัดชมโครงการ</h2><p className="mt-1 text-sm text-slate-500">ทีมงานจะติดต่อกลับโดยเร็วที่สุด</p></div><button className="text-2xl text-slate-400" onClick={() => setOpen(false)} aria-label="ปิด">×</button></div>
        {status === "success" ? <div className="rounded-xl bg-emerald-50 p-5 text-emerald-800"><p className="font-bold">ส่งข้อมูลเรียบร้อย</p><p className="mt-1 text-sm">ขอบคุณที่สนใจโครงการ MIDA</p></div> : <form onSubmit={submit} className="space-y-3">
          <input name="name" required placeholder="ชื่อ-นามสกุล" className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#002D62]" />
          <input name="phone" required placeholder="เบอร์โทรศัพท์" inputMode="tel" className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#002D62]" />
          <input name="email" type="email" placeholder="อีเมล (ถ้ามี)" className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#002D62]" />
          <select name="budget" className="w-full rounded-xl border border-slate-200 p-3 text-slate-600"><option value="">งบประมาณที่สนใจ</option><option>1-2 ล้านบาท</option><option>2-3 ล้านบาท</option><option>3-5 ล้านบาท</option><option>มากกว่า 5 ล้านบาท</option></select>
          {status === "error" && <p className="text-sm text-red-600">ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง</p>}
          <button disabled={status === "sending"} className="button-primary w-full disabled:opacity-60">{status === "sending" ? "กำลังส่ง..." : "ส่งคำขอนัดชม"}</button>
        </form>}
      </div>
    </div>}
  </>;
}
