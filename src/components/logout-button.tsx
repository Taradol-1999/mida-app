"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
      className="w-full rounded-lg border border-white/15 px-3 py-2 text-left text-sm text-slate-300 hover:bg-rose-900/60 hover:text-rose-100"
    >
      <i className="fa-solid fa-right-from-bracket mr-2" />
      ออกจากระบบ
    </button>
  );
}
