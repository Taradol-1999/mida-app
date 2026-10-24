"use client";

import { AdminFeedback, useAdminFeedback } from "@/components/admin-feedback";

import { useEffect, useState } from "react";
import { BannerMediaUpload } from "@/components/banner-media-upload";
import type { ProjectLocationData } from "@/lib/project-location";
import { placeIconNames, placeIconLabels } from "@/lib/place-icons";

type Media = { id: string; name: string; mimeType: string; url: string };
export function ProjectLocationManager({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProjectLocationData>({ mapUrl: "", imageId: null, places: [] });
  const [media, setMedia] = useState<Media[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useAdminFeedback();
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetch(`/api/admin/project-location?projectId=${projectId}`),
      fetch(`/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=map-image&list=1`),
    ])
      .then(async ([content, images]) => {
        if (!content.ok || !images.ok) throw new Error("โหลดข้อมูลไม่สำเร็จ กรุณาลองใหม่");
        const [saved, assets] = await Promise.all([content.json(), images.json()]);
        if (!cancelled) {
          setData(saved.data);
          setMedia(assets.rows);
          setReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) setMessage(error.message);
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, setMessage]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      let imageId = data.imageId;
      if (files[0]) {
        const form = new FormData();
        form.set("entityType", "projects");
        form.set("entityId", projectId);
        form.set("mediaKind", "map-image");
        form.set("file", files[0]);
        const response = await fetch("/api/admin/media", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "อัปโหลดไม่สำเร็จ");
        imageId = result.id;
        setMedia([
          {
            id: result.id,
            name: files[0].name,
            mimeType: files[0].type,
            url: `/api/admin/media?entityType=projects&entityId=${projectId}&mediaKind=map-image&mediaId=${result.id}`,
          },
        ]);
        setData((current) => ({ ...current, imageId }));
        setFiles([]);
      }
      const response = await fetch("/api/admin/project-location", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, data: { ...data, imageId } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "บันทึกไม่สำเร็จ");
      setMessage("บันทึกแผนที่และสถานที่ใกล้เคียงเรียบร้อยแล้ว", "success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
      <h1 className="text-2xl font-extrabold text-brand-primary">แผนที่และสถานที่ใกล้เคียง</h1>
      <p className="mt-2 text-sm text-slate-500">จัดการแผนที่โครงการและลิงก์สถานที่ใกล้เคียงสำหรับหน้าบ้าน</p>
      <AdminFeedback notice={message} />
      <form onSubmit={save} className="mt-6">
        <fieldset disabled={!ready || busy} className="grid min-w-0 gap-6 disabled:opacity-60">
          <label className="text-sm font-semibold">
            URL แผนที่โครงการ
            <input
              type="url"
              maxLength={2000}
              className="form-control"
              placeholder="https://maps.google.com/…"
              value={data.mapUrl}
              onChange={(event) => setData({ ...data, mapUrl: event.target.value })}
            />
          </label>
          <BannerMediaUpload
            title="รูปภาพแผนที่โครงการ"
            single
            allowVideo={false}
            media={media.filter((item) => item.id === data.imageId)}
            files={files}
            onFilesChange={setFiles}
            onRemove={() => setData({ ...data, imageId: null })}
            disabled={busy}
          />
          <div className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold text-brand-primary">สถานที่ใกล้เคียง</h2>
              <button
                type="button"
                className="admin-button-primary"
                onClick={() => setData({ ...data, places: [...data.places, { name: "", nameEn: "", url: "" }] })}
              >
                <i className="fa-solid fa-plus" aria-hidden="true" />
                เพิ่มสถานที่
              </button>
            </div>
            <div className="mt-4 grid gap-4">
              {data.places.map((place, index) => (
                <div
                  key={index}
                  className="grid items-end gap-3 rounded-xl bg-slate-50 p-4 lg:grid-cols-[1fr_1fr_1.3fr_auto]"
                >
                  <fieldset className="min-w-0 lg:col-span-4">
                    <legend className="mb-2 text-sm font-semibold">ไอคอนสถานที่</legend>
                    <div className="flex flex-wrap gap-2">
                      {placeIconNames.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          title={placeIconLabels[icon]}
                          aria-label={placeIconLabels[icon]}
                          aria-pressed={(place.icon ?? "fa-location-dot") === icon}
                          onClick={() =>
                            setData({
                              ...data,
                              places: data.places.map((item, position) =>
                                position === index ? { ...item, icon } : item,
                              ),
                            })
                          }
                          className={`grid size-10 place-items-center rounded-lg border transition focus-visible:outline-2 focus-visible:outline-brand-primary ${(place.icon ?? "fa-location-dot") === icon ? "border-brand-primary bg-brand-primary text-white" : "border-slate-200 bg-white text-brand-primary hover:bg-brand-soft"}`}
                        >
                          <i className={`fa-solid ${icon}`} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{placeIconLabels[place.icon ?? "fa-location-dot"]}</p>
                  </fieldset>
                  <label className="text-sm">
                    ชื่อสถานที่ (TH) *
                    <input
                      required
                      maxLength={255}
                      className="form-control"
                      value={place.name}
                      onChange={(event) =>
                        setData({
                          ...data,
                          places: data.places.map((item, position) =>
                            position === index ? { ...item, name: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    ชื่อสถานที่ (EN)
                    <input
                      maxLength={255}
                      className="form-control"
                      value={place.nameEn ?? ""}
                      onChange={(event) =>
                        setData({
                          ...data,
                          places: data.places.map((item, position) =>
                            position === index ? { ...item, nameEn: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <label className="text-sm">
                    URL สถานที่ *
                    <input
                      required
                      type="url"
                      maxLength={2000}
                      placeholder="https://…"
                      className="form-control"
                      value={place.url}
                      onChange={(event) =>
                        setData({
                          ...data,
                          places: data.places.map((item, position) =>
                            position === index ? { ...item, url: event.target.value } : item,
                          ),
                        })
                      }
                    />
                  </label>
                  <button
                    type="button"
                    aria-label={`ลบสถานที่ ${index + 1}`}
                    className="grid size-11 place-items-center rounded-lg text-red-600 hover:bg-red-50"
                    onClick={() =>
                      setData({ ...data, places: data.places.filter((_, position) => position !== index) })
                    }
                  >
                    <i className="fa-solid fa-trash" aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
            {!data.places.length && <p className="py-6 text-center text-sm text-slate-400">ยังไม่มีสถานที่ใกล้เคียง</p>}
          </div>
          <div>
            <button type="submit" className="admin-button-primary">
              {busy ? "กำลังบันทึก…" : "บันทึกข้อมูล"}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );
}
