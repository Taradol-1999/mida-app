import Link from "next/link";
import { notFound } from "next/navigation";
import { T } from "@/components/language-provider";
import { MidaPageLayout } from "@/components/mida-page-layout";
import { BlogImageSlider } from "@/components/blog-image-slider";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();

  const article = await prisma.midaBlogItem.findFirst({ where: { id, is_active: true } });
  if (!article) notFound();
  const images = await prisma.mediaAsset.findMany({
    where: { entity_type: "mida-blog", entity_id: id, media_kind: { in: ["cover", "gallery"] } },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  images.sort((a, b) => Number(b.media_kind === "cover") - Number(a.media_kind === "cover"));

  return (
    <MidaPageLayout innerPage>
      <article className="bg-[#eef5fa] pb-12 pt-24 sm:pb-16 sm:pt-28">
        <div className="container-page">
          <Link href="/#promotion" className="mb-5 block text-sm font-bold text-brand-primary">
            <i className="fa-solid fa-arrow-left mr-2" aria-hidden="true" />
            <T th="กลับไปที่ Blog" en="Back to Blog" />
          </Link>
          <div className="w-full overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,40,80,.08)]">
            <BlogImageSlider
              images={images.map((image) => ({
                src: `/api/admin/media?entityType=mida-blog&entityId=${id}&mediaKind=${image.media_kind}&mediaId=${image.id}`,
                alt: image.original_name || article.name_th,
              }))}
            />
            <div className="p-6 sm:p-10 lg:p-12">
              <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA PROPERTY · BLOG</p>
              <h1 className="mt-3 text-2xl font-extrabold leading-snug text-brand-primary sm:text-4xl">
                <T th={article.name_th} en={article.name_en || article.name_th} />
              </h1>
              {(article.description_th || article.description_en) && (
                <div className="mt-6 whitespace-pre-wrap text-sm leading-8 text-slate-600 sm:text-base">
                  <T th={article.description_th ?? ""} en={article.description_en || article.description_th || ""} />
                </div>
              )}
            </div>
          </div>
        </div>
      </article>
    </MidaPageLayout>
  );
}
