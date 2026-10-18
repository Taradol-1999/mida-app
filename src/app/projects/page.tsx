import { ProjectFilter } from "@/components/project-filter";
import { T } from "@/components/language-provider";
import { MidaPageLayout } from "@/components/mida-page-layout";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const requestedType = (await searchParams).type;
  return (
    <MidaPageLayout innerPage>
      <div className="min-h-[65vh] bg-[#eaf4fb]">
      <section className="pb-2 pt-28 sm:pt-32">
        <div className="container-page">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA PROPERTY</p>
          <h1 className="mt-3 text-3xl font-extrabold text-brand-primary sm:text-4xl">
            <T th="โครงการทั้งหมด" en="All Projects" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
            <T
              th="ค้นหาและเปรียบเทียบโครงการที่อยู่อาศัยจาก MIDA ในทำเลและช่วงราคาที่เหมาะกับคุณ"
              en="Search and compare MIDA residential projects by the location and price range that suit you."
            />
          </p>
        </div>
      </section>
      <ProjectFilter standalone initialType={typeof requestedType === "string" ? requestedType : undefined} />
      </div>
    </MidaPageLayout>
  );
}
