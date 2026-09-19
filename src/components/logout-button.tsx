"use client";
import { useRouter } from "next/navigation";
export function LogoutButton() { const router = useRouter(); return <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); router.refresh(); }} className="w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-slate-300 hover:bg-white/10">ออกจากระบบ</button>; }
