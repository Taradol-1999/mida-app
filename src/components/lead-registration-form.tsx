"use client";

import { type FormEvent, type ReactNode, useState } from "react";
import { useTranslation } from "@/components/language-provider";

/** Browser submission only; the project page owns the form fields and layout. */
export function LeadRegistrationForm({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "sending") return;
    const form = event.currentTarget;
    setStatus("sending");
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!response.ok) throw new Error("Registration failed");
      form.reset();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }
  if (status === "success")
    return (
      <div role="status" className="rounded-2xl bg-emerald-50 p-8 text-center text-emerald-800">
        <i className="fa-solid fa-circle-check text-4xl" aria-hidden="true" />
        <p className="mt-3 font-bold">{t({ th: "ส่งข้อมูลเรียบร้อย", en: "Your information has been sent." })}</p>
        <p className="mt-2 text-sm">
          {t({
            th: "ขอบคุณที่สนใจโครงการ MIDA ทีมงานจะติดต่อกลับโดยเร็วที่สุด",
            en: "Thank you for your interest in MIDA. Our team will contact you shortly.",
          })}
        </p>
      </div>
    );
  return (
    <form onSubmit={submit} className="lead-registration-form space-y-6">
      <fieldset disabled={status === "sending"} className="min-w-0 space-y-6 disabled:opacity-60">
        {children}
      </fieldset>
      {status === "error" && (
        <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {t({
            th: "ส่งข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง",
            en: "Unable to send your information. Please try again.",
          })}
        </p>
      )}
      <button
        type="submit"
        disabled={status === "sending"}
        className="button-primary min-h-13 w-full py-3.5 text-base disabled:opacity-60"
      >
        {status === "sending"
          ? t({ th: "กำลังส่ง…", en: "Sending…" })
          : t({ th: "ลงทะเบียนรับข้อเสนอพิเศษ", en: "Register for a special offer" })}
        <i
          className={`fa-solid ${status === "sending" ? "fa-spinner animate-spin" : "fa-arrow-right"}`}
          aria-hidden="true"
        />
      </button>
    </form>
  );
}
