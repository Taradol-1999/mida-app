import Image from "next/image";
import Link from "next/link";
import { MidaPageLayout } from "@/components/mida-page-layout";
import { T } from "@/components/language-provider";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BlogListPage() {
  const articles = await prisma.midaBlogItem.findMany({ where: { is_active: true }, orderBy: { created_at: "desc" } });
  const media = await prisma.mediaAsset.findMany({
    where: {
      entity_type: "mida-blog",
      entity_id: { in: articles.map((article) => article.id) },
      media_kind: { in: ["cover", "gallery"] },
    },
    orderBy: [{ sort_order: "asc" }, { created_at: "asc" }],
  });
  const covers = new Map<string, (typeof media)[number]>();
  for (const image of media)
    if (!covers.has(image.entity_id) || image.media_kind === "cover") covers.set(image.entity_id, image);

  return (
    <MidaPageLayout innerPage>
      <section className="min-h-[65vh] bg-[#eaf4fb] pb-16 pt-28 sm:pb-24 sm:pt-32">
        <div className="container-page">
          <p className="text-xs font-bold tracking-[0.2em] text-brand-accent">MIDA PROPERTY · BLOG</p>
          <h1 className="mt-3 text-3xl font-extrabold text-brand-primary sm:text-4xl">
            <T th="เรื่องราวที่น่าสนใจ" en="Stories worth exploring" />
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-500 sm:text-base">
            <T
              th="รวบรวมทุกบทความ ข่าวสาร ไลฟ์สไตล์ของธุรกิจเครือไมด้า"
              en="Articles, news, and lifestyle stories from the MIDA group."
            />
          </p>
          {articles.length ? (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => {
                const image = covers.get(article.id);
                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.id}`}
                    className="group overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-video overflow-hidden bg-slate-100">
                      {image ? (
                        <Image
                          src={`/api/admin/media?entityType=mida-blog&entityId=${article.id}&mediaKind=${image.media_kind}&mediaId=${image.id}`}
                          alt={article.name_th}
                          fill
                          unoptimized
                          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                          className="object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <span className="absolute inset-0 grid place-items-center text-4xl text-slate-300">
                          <i className="fa-regular fa-image" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                    <div className="p-5 sm:p-6">
                      <p className="text-xs font-bold tracking-widest text-brand-accent">BLOG</p>
                      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-brand-primary">
                        <T th={article.name_th} en={article.name_en || article.name_th} />
                      </h2>
                      {(article.description_th || article.description_en) && (
                        <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm leading-6 text-slate-500">
                          <T
                            th={article.description_th ?? ""}
                            en={article.description_en || article.description_th || ""}
                          />
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="mt-9 rounded-2xl bg-white p-10 text-center text-sm text-slate-500">
              <T th="ยังไม่มีบทความในขณะนี้" en="There are no articles yet." />
            </p>
          )}
        </div>
      </section>
    </MidaPageLayout>
  );
}
