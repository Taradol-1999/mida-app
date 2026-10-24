"use client";

import { AdminFeedback, useAdminFeedback } from "@/components/admin-feedback";

import { useEffect, useState } from "react";
import Image from "next/image";
import { BannerMediaUpload } from "@/components/banner-media-upload";
import type { ProjectShowcaseData } from "@/lib/project-showcase";

type Media = { id: string; name: string; mimeType: string; url: string };

function CardPreview({ file, src, name }: { file?: File; src?: string; name: string }) {
  const [localUrl, setLocalUrl] = useState("");
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const url = file ? localUrl : src;
  return (
    <div className="relative aspect-16/10 overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
      {url ? (
        <Image
          src={url}
          alt={name}
          fill
          unoptimized
          sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
          className="object-contain p-2"
        />
      ) : (
        <span className="absolute inset-0 grid place-items-center text-sm text-slate-400">กำลังโหลดรูปภาพ…</span>
      )}
    </div>
  );
}
export function ProjectShowcaseManager({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectShowcaseData>({ title: "", description: "", items: [] });
  const [media, setMedia] = useState<Media[]>([]);
  const [pending, setPending] = useState<
    { file: File; name: string; description: string; nameEn?: string; descriptionEn?: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useAdminFeedback();
  const mediaUrl = `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=nearby&list=1`;

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetch(`/api/admin/project-showcase?projectId=${projectId}`), fetch(mediaUrl)])
      .then(async ([content, images]) => {
        if (!content.ok || !images.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
        const [saved, assets] = await Promise.all([content.json(), images.json()]);
        if (cancelled) return;
        if (saved.data) setData(saved.data);
        setMedia(assets.rows);
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, mediaUrl, setMessage]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!data.title.trim() || [...data.items, ...pending].some((item) => !item.name.trim())) {
      setMessage("กรุณากรอกหัวข้อหลักและชื่อรูปภาษาไทยให้ครบ");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const items = [...data.items];
      // Keep successful uploads in the form so retries never upload the same file twice.
      for (const entry of pending) {
        const upload = new FormData();
        upload.set("entityType", "projects");
        upload.set("entityId", projectId);
        upload.set("mediaKind", "nearby");
        upload.set("file", entry.file);
        const response = await fetch("/api/admin/media", { method: "POST", body: upload });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "อัปโหลดไม่สำเร็จ");
        items.push({
          mediaId: result.id,
          name: entry.name,
          description: entry.description,
          nameEn: entry.nameEn,
          descriptionEn: entry.descriptionEn,
        });
        setData((value) => ({ ...value, items: [...items] }));
        setPending((value) => value.filter((item) => item !== entry));
      }
      const response = await fetch("/api/admin/project-showcase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, data: { ...data, items } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "บันทึกไม่สำเร็จ");
      const images = await fetch(mediaUrl);
      if (images.ok) setMedia((await images.json()).rows);
      setMessage("บันทึกข้อมูลเรียบร้อยแล้ว", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <h1 className="text-2xl font-extrabold text-brand-primary">จุดเด่นทำเลโครงการ</h1>
      <p className="mt-2 text-sm text-slate-500">จัดการข้อความและการ์ดรูปภาพที่แสดงใต้แบนเนอร์หลักของโครงการ</p>
      <AdminFeedback notice={message} />
      <form onSubmit={save} className="mt-6">
        <fieldset disabled={loading || busy} className="grid min-w-0 gap-5 disabled:opacity-60">
          <div className="grid gap-5 md:grid-cols-2">
            {(["th", "en"] as const).map((language) => {
              const titleField = language === "th" ? "title" : "titleEn";
              const descriptionField = language === "th" ? "description" : "descriptionEn";
              return (
                <div key={language} className="grid content-start gap-4">
                  <label className="text-sm font-bold">
                    หัวข้อหลัก ({language.toUpperCase()}) {language === "th" && "*"}
                    <textarea
                      required={language === "th"}
                      maxLength={255}
                      rows={3}
                      className="form-control"
                      value={data[titleField] ?? ""}
                      onChange={(event) => setData({ ...data, [titleField]: event.target.value })}
                    />
                  </label>
                  <label className="text-sm font-bold">
                    คำอธิบาย ({language.toUpperCase()})
                    <textarea
                      maxLength={10000}
                      rows={4}
                      className="form-control"
                      value={data[descriptionField] ?? ""}
                      onChange={(event) => setData({ ...data, [descriptionField]: event.target.value })}
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <BannerMediaUpload
            title="รูปภาพทำเลโครงการ"
            hideEmptyState
            allowVideo={false}
            media={[]}
            files={[]}
            onFilesChange={(files) =>
              setPending([...pending, ...files.map((file) => ({ file, name: "", description: "" }))])
            }
            onRemove={(id) => setData({ ...data, items: data.items.filter((item) => item.mediaId !== id) })}
          />
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.items
              .map((item, index) => ({ item, index }))
              .reverse()
              .map(({ item, index }) => (
                <div
                  key={item.mediaId}
                  className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-brand-primary/30 hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-accent-soft text-[11px] font-bold text-brand-primary">
                        {index + 1}
                      </span>
                      <span
                        className="truncate text-xs font-medium text-slate-600"
                        title={media.find((image) => image.id === item.mediaId)?.name}
                      >
                        {media.find((image) => image.id === item.mediaId)?.name || item.name}
                      </span>
                    </div>
                    <button
                      type="button"
                      aria-label="ลบรูปภาพ"
                      onClick={() =>
                        setData({ ...data, items: data.items.filter((row) => row.mediaId !== item.mediaId) })
                      }
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <i className="fa-regular fa-trash-can text-xs" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mb-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    <div className="aspect-video w-full overflow-hidden">
                      <CardPreview src={media.find((image) => image.id === item.mediaId)?.url} name={item.name} />
                    </div>
                  </div>
                  <div className="space-y-2.5">
                    {(["th", "en"] as const).map((language) => {
                      const nameField = language === "th" ? "name" : "nameEn";
                      const descriptionField = language === "th" ? "description" : "descriptionEn";
                      return (
                        <div key={language} className="space-y-2.5">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                              ชื่อรูปภาพ ({language.toUpperCase()}){" "}
                              {language === "th" && <span className="text-red-500">*</span>}
                            </span>
                            <input
                              required={language === "th"}
                              maxLength={255}
                              placeholder="ชื่อรูปภาพ"
                              className="form-control w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none transition-colors focus:border-brand-primary"
                              value={item[nameField] ?? ""}
                              onChange={(event) =>
                                setData({
                                  ...data,
                                  items: data.items.map((row, position) =>
                                    position === index ? { ...row, [nameField]: event.target.value } : row,
                                  ),
                                })
                              }
                            />
                          </label>
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                              คำอธิบายสั้น ๆ ({language.toUpperCase()})
                            </span>
                            <textarea
                              rows={2}
                              placeholder="คำอธิบาย..."
                              maxLength={1000}
                              className="form-control w-full resize-y rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none transition-colors focus:border-brand-primary"
                              value={item[descriptionField] ?? ""}
                              onChange={(event) =>
                                setData({
                                  ...data,
                                  items: data.items.map((row, position) =>
                                    position === index ? { ...row, [descriptionField]: event.target.value } : row,
                                  ),
                                })
                              }
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center border-t border-slate-100 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-emerald-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      บันทึกแล้ว
                    </span>
                  </div>
                </div>
              ))}
            {pending
              .map((item, index) => ({ item, index }))
              .reverse()
              .map(({ item, index }) => (
                <div
                  key={index}
                  className="order-first group min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all duration-200 hover:border-brand-primary/30 hover:shadow-md"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-accent-soft text-[11px] font-bold text-brand-primary">
                        {data.items.length + index + 1}
                      </span>
                      <span className="truncate text-xs font-medium text-slate-600" title={item.file.name}>
                        {item.file.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      title="ลบรูปภาพ"
                      onClick={() => setPending((prev) => prev.filter((_, position) => position !== index))}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <i className="fa-regular fa-trash-can text-xs" />
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="mb-3 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
                    <div className="aspect-video w-full overflow-hidden">
                      <CardPreview file={item.file} name={item.file.name} />
                    </div>
                  </div>

                  {/* Fields */}
                  <div className="space-y-2.5">
                    {(["th", "en"] as const).map((language) => {
                      const nameField = language === "th" ? "name" : "nameEn";
                      const descriptionField = language === "th" ? "description" : "descriptionEn";
                      return (
                        <div key={language} className="space-y-2.5">
                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                              ชื่อรูปภาพ ({language.toUpperCase()}){" "}
                              {language === "th" && <span className="text-red-500">*</span>}
                            </span>
                            <input
                              required={language === "th"}
                              maxLength={255}
                              placeholder="ชื่อรูปภาพ"
                              className="form-control w-full rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none transition-colors focus:border-brand-primary"
                              value={item[nameField] ?? ""}
                              onChange={(event) =>
                                setPending((prev) =>
                                  prev.map((row, position) =>
                                    position === index ? { ...row, [nameField]: event.target.value } : row,
                                  ),
                                )
                              }
                            />
                          </label>

                          <label className="block">
                            <span className="mb-1 block text-[11px] font-semibold text-slate-600">
                              คำอธิบายสั้น ๆ ({language.toUpperCase()})
                            </span>
                            <textarea
                              rows={2}
                              maxLength={1000}
                              placeholder="คำอธิบาย..."
                              className="form-control w-full resize-y rounded-lg border border-slate-200 px-2.5 py-2 text-xs outline-none transition-colors focus:border-brand-primary"
                              value={item[descriptionField] ?? ""}
                              onChange={(event) =>
                                setPending((prev) =>
                                  prev.map((row, position) =>
                                    position === index ? { ...row, [descriptionField]: event.target.value } : row,
                                  ),
                                )
                              }
                            />
                          </label>
                        </div>
                      );
                    })}
                  </div>

                  {/* Status */}
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-amber-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                      รอบันทึก
                    </span>
                    <span className="text-[10px] text-slate-400">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                </div>
              ))}
          </div>
          <div>
            <button type="submit" className="admin-button-primary">
              {busy ? "กำลังบันทึก…" : loading ? "กำลังโหลด…" : "บันทึกข้อมูล"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
