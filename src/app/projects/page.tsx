import { ProjectFilter } from "@/components/project-filter";
import { T } from "@/components/language-provider";
import { MidaPageLayout } from "@/components/mida-page-layout";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ type?: string | string[] }> }) {
  const requestedType = (await searchParams).type;
  return (
    <MidaPageLayout innerPage>
      <section className="bg-brand-primary pb-12 pt-28 text-white sm:pb-16 sm:pt-32">
        <div className="container-page">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA PROPERTY</p>
          <h1 className="mt-3 text-3xl font-extrabold sm:text-4xl">
            <T th="โครงการทั้งหมด" en="All Projects" />
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-blue-100">
            <T
              th="ค้นหาและเปรียบเทียบโครงการที่อยู่อาศัยจาก MIDA ในทำเลและช่วงราคาที่เหมาะกับคุณ"
              en="Search and compare MIDA residential projects by the location and price range that suit you."
            />
          </p>
        </div>
      </section>
      <ProjectFilter standalone initialType={typeof requestedType === "string" ? requestedType : undefined} />
    </MidaPageLayout>
  );
}
