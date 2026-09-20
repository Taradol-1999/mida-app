"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(form)),
    });
    if (response.ok) router.push("/admin");
    else setError((await response.json()).message ?? "เข้าสู่ระบบไม่สำเร็จ");
    setLoading(false);
  }
  return (
    <form onSubmit={submit} className="mt-7 space-y-4">
      <label className="block text-sm font-bold text-slate-700">
        อีเมล
        <input
          required
          name="email"
          type="email"
          className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-brand-primary"
          placeholder="admin@mida.local"
        />
      </label>
      <label className="block text-sm font-bold text-slate-700">
        รหัสผ่าน
        <input
          required
          name="password"
          type="password"
          className="mt-1.5 w-full rounded-xl border border-slate-200 p-3 font-normal outline-none focus:border-brand-primary"
        />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="button-primary w-full disabled:opacity-60">
        {loading ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
