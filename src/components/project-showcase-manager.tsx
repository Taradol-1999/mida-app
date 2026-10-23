"use client";

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
    <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
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
  const [pending, setPending] = useState<{ file: File; name: string; description: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
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
  }, [projectId, mediaUrl]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const items = [...data.items];
      // Keep successful uploads in the form so retries never upload the same file twice.
      for (const entry of [...pending].reverse()) {
        const upload = new FormData();
        upload.set("entityType", "projects");
        upload.set("entityId", projectId);
        upload.set("mediaKind", "nearby");
        upload.set("file", entry.file);
        const response = await fetch("/api/admin/media", { method: "POST", body: upload });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "อัปโหลดไม่สำเร็จ");
        items.unshift({ mediaId: result.id, name: entry.name, description: entry.description });
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
      setMessage("บันทึกข้อมูลเรียบร้อยแล้ว");
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
      {message && (
        <p role="status" className="my-4 rounded-xl bg-brand-soft p-4 text-sm text-brand-primary">
          {message}
        </p>
      )}
      <form onSubmit={save} className="mt-6">
        <fieldset disabled={loading || busy} className="grid min-w-0 gap-5 disabled:opacity-60">
          <label className="text-sm font-bold">
            หัวข้อหลัก *
            <textarea
              required
              maxLength={255}
              rows={3}
              className="form-control"
              value={data.title}
              onChange={(event) => setData({ ...data, title: event.target.value })}
            />
          </label>
          <label className="text-sm font-bold">
            คำอธิบาย
            <textarea
              maxLength={10000}
              rows={4}
              className="form-control"
              value={data.description}
              onChange={(event) => setData({ ...data, description: event.target.value })}
            />
          </label>
          <BannerMediaUpload
            title="รูปภาพทำเลโครงการ"
            hideEmptyState
            allowVideo={false}
            media={[]}
            files={[]}
            onFilesChange={(files) =>
              setPending([...files.map((file) => ({ file, name: "", description: "" })), ...pending])
            }
            onRemove={(id) => setData({ ...data, items: data.items.filter((item) => item.mediaId !== id) })}
          />
          <div className="grid min-w-0 gap-4">
            {data.items.map((item, index) => (
              <div
                key={item.mediaId}
                className="grid min-w-0 gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[14rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[18rem_minmax(0,1fr)]"
              >
                <p className="truncate text-xs font-semibold text-slate-500 sm:col-span-2">
                  รูปที่ {index + 1} · {media.find((image) => image.id === item.mediaId)?.name}
                </p>
                <div className="sm:row-span-3">
                  <CardPreview src={media.find((image) => image.id === item.mediaId)?.url} name={item.name} />
                </div>
                <label className="text-sm">
                  ชื่อรูป *
                  <input
                    required
                    maxLength={255}
                    className="form-control"
                    value={item.name}
                    onChange={(event) =>
                      setData({
                        ...data,
                        items: data.items.map((row, position) =>
                          position === index ? { ...row, name: event.target.value } : row,
                        ),
                      })
                    }
                  />
                </label>
                <label className="text-sm">
                  คำอธิบายสั้น ๆ
                  <textarea
                    maxLength={1000}
                    className="form-control"
                    value={item.description}
                    onChange={(event) =>
                      setData({
                        ...data,
                        items: data.items.map((row, position) =>
                          position === index ? { ...row, description: event.target.value } : row,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setData({ ...data, items: data.items.filter((row) => row.mediaId !== item.mediaId) })}
                  className="justify-self-start text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  <i className="fa-solid fa-trash mr-2" aria-hidden="true" />
                  ลบรายการรูปนี้
                </button>
              </div>
            ))}
            {pending.map((item, index) => (
              <div
                key={index}
                className="order-first grid min-w-0 gap-4 rounded-2xl border border-brand-primary/20 bg-white p-4 shadow-sm sm:grid-cols-[14rem_minmax(0,1fr)] sm:p-5 lg:grid-cols-[18rem_minmax(0,1fr)]"
              >
                <div className="flex min-w-0 items-center gap-2 sm:col-span-2">
                  <span className="shrink-0 rounded-full bg-brand-accent-soft px-2.5 py-1 text-[11px] font-bold text-brand-primary">
                    รอบันทึก
                  </span>
                  <p className="truncate text-xs text-slate-500" title={item.file.name}>
                    {item.file.name}
                  </p>
                </div>
                <div className="sm:row-span-3">
                  <CardPreview file={item.file} name={item.file.name} />
                </div>
                <label className="text-sm">
                  ชื่อรูป *
                  <input
                    required
                    maxLength={255}
                    className="form-control"
                    value={item.name}
                    onChange={(event) =>
                      setPending(
                        pending.map((row, position) =>
                          position === index ? { ...row, name: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <label className="text-sm">
                  คำอธิบายสั้น ๆ
                  <textarea
                    maxLength={1000}
                    className="form-control"
                    value={item.description}
                    onChange={(event) =>
                      setPending(
                        pending.map((row, position) =>
                          position === index ? { ...row, description: event.target.value } : row,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setPending(pending.filter((_, position) => position !== index))}
                  className="justify-self-start text-sm font-semibold text-red-600 hover:text-red-800"
                >
                  <i className="fa-solid fa-trash mr-2" aria-hidden="true" />
                  ลบรายการรูปนี้
                </button>
              </div>
            ))}
          </div>
          <div>
            <button type="submit" className="button-primary">
              {busy ? "กำลังบันทึก…" : loading ? "กำลังโหลด…" : "บันทึกข้อมูล"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
