import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center bg-brand-muted p-4">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/10">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-brand-primary">
          <span className="grid size-9 place-items-center rounded bg-brand-accent text-brand-primary">M</span>MIDA ADMIN
        </Link>
        <div className="mt-8">
          <p className="text-sm font-bold text-brand-text">SECURE ACCESS</p>
          <h1 className="mt-2 text-3xl font-extrabold text-brand-primary">เข้าสู่ระบบหลังบ้าน</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">สำหรับผู้ดูแลระบบที่ได้รับอนุญาตเท่านั้น</p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}
