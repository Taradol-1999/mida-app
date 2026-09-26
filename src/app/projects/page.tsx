import Link from "next/link";
import { ProjectFilter } from "@/components/project-filter";
import { LanguageToggle, T } from "@/components/language-provider";

export const dynamic = "force-dynamic";

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-brand-muted">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
          <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight text-brand-primary">
            <span className="grid size-9 place-items-center rounded bg-brand-accent text-sm text-brand-primary">M</span>
            <span>
              MIDA <span className="hidden sm:inline">PROPERTY</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
          <LanguageToggle />
          <Link href="/" className="text-sm font-bold text-brand-primary transition hover:text-brand-text">
            <i className="fa-solid fa-arrow-left mr-2" />
            <T th="หน้าแรก" en="Home" />
          </Link>
          </div>
        </div>
      </header>
      <section className="bg-brand-primary py-12 text-white sm:py-16">
        <div className="container-page">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA PROPERTY</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl"><T th="โครงการทั้งหมด" en="All Projects" /></h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            <T th="ค้นหาและเปรียบเทียบโครงการที่อยู่อาศัยจาก MIDA ในทำเลและช่วงราคาที่เหมาะกับคุณ" en="Search and compare MIDA residential projects by the location and price range that suit you." />
          </p>
        </div>
      </section>
      <ProjectFilter standalone />
    </main>
  );
}
