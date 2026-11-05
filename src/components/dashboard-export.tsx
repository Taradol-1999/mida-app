"use client";

import { useState } from "react";

export type DashboardExportMetric = {
  label: string;
  value: string;
  unit?: string;
};

export type DashboardExportSection = {
  title: string;
  rows: Array<{ label: string; value: string | number; detail?: string }>;
};

type DashboardExportProps = {
  title: string;
  periodLabel: string;
  fileStem: string;
  metrics: DashboardExportMetric[];
  sections: DashboardExportSection[];
};

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius = 18,
) {
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
}

export function DashboardExport({ title, periodLabel, fileStem, metrics, sections }: DashboardExportProps) {
  const [exporting, setExporting] = useState<"excel" | "image" | null>(null);

  function exportExcel() {
    setExporting("excel");
    try {
      const rows = sections
        .flatMap((section) =>
          section.rows.map(
            (row) =>
              `<tr><td>${escapeHtml(section.title)}</td><td>${escapeHtml(row.label)}</td><td>${escapeHtml(row.value)}</td><td>${escapeHtml(row.detail ?? "")}</td></tr>`,
          ),
        )
        .join("");
      const metricRows = metrics
        .map(
          (metric) =>
            `<tr><td>สรุป</td><td>${escapeHtml(metric.label)}</td><td>${escapeHtml(metric.value)}</td><td>${escapeHtml(metric.unit ?? "")}</td></tr>`,
        )
        .join("");
      const workbook = `<!doctype html><html><head><meta charset="utf-8"></head><body><table><thead><tr><th colspan="4">${escapeHtml(title)}</th></tr><tr><th colspan="4">${escapeHtml(periodLabel)}</th></tr><tr><th>หมวดหมู่</th><th>รายการ</th><th>ค่า</th><th>รายละเอียด</th></tr></thead><tbody>${metricRows}${rows}</tbody></table></body></html>`;
      download(new Blob(["\ufeff", workbook], { type: "application/vnd.ms-excel;charset=utf-8" }), `${fileStem}.xls`);
    } finally {
      setExporting(null);
    }
  }

  function exportImage() {
    setExporting("image");
    try {
      const canvas = document.createElement("canvas");
      const width = 1600;
      const padding = 64;
      const metricHeight = 150;
      const sectionHeights = sections.map((section) => Math.max(156, 88 + section.rows.length * 42));
      const height =
        padding * 2 + 116 + metricHeight + 36 + sectionHeights.reduce((total, item) => total + item + 28, 0);
      const scale = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = width * scale;
      canvas.height = height * scale;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("ไม่สามารถสร้างรูปภาพรายงานได้");
      context.scale(scale, scale);
      context.fillStyle = "#f8fafc";
      context.fillRect(0, 0, width, height);
      context.fillStyle = "#073c67";
      context.fillRect(0, 0, width, 18);
      context.fillStyle = "#073c67";
      context.font = "700 38px 'Noto Sans Thai', sans-serif";
      context.fillText(title, padding, 82);
      context.fillStyle = "#64748b";
      context.font = "500 22px 'Noto Sans Thai', sans-serif";
      context.fillText(periodLabel, padding, 116);

      const metricWidth = (width - padding * 2 - (metrics.length - 1) * 24) / metrics.length;
      metrics.forEach((metric, index) => {
        const x = padding + index * (metricWidth + 24);
        context.fillStyle = "#ffffff";
        roundedRect(context, x, 148, metricWidth, metricHeight);
        context.fillStyle = "#e7b957";
        context.fillRect(x, 148, 8, metricHeight);
        context.fillStyle = "#475569";
        context.font = "600 20px 'Noto Sans Thai', sans-serif";
        context.fillText(metric.label, x + 30, 194);
        context.fillStyle = "#073c67";
        context.font = "700 38px 'Noto Sans Thai', sans-serif";
        context.fillText(metric.value, x + 30, 246);
        if (metric.unit) {
          const valueWidth = context.measureText(metric.value).width;
          context.fillStyle = "#64748b";
          context.font = "500 18px 'Noto Sans Thai', sans-serif";
          context.fillText(metric.unit, x + 42 + valueWidth, 246);
        }
      });

      let y = 334;
      for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex += 1) {
        const section = sections[sectionIndex];
        const sectionHeight = sectionHeights[sectionIndex];
        context.fillStyle = "#ffffff";
        roundedRect(context, padding, y, width - padding * 2, sectionHeight);
        context.fillStyle = "#073c67";
        context.font = "700 24px 'Noto Sans Thai', sans-serif";
        context.fillText(section.title, padding + 28, y + 44);
        const max = Math.max(...section.rows.map((row) => Number(row.value) || 0), 1);
        section.rows.forEach((row, index) => {
          const rowY = y + 82 + index * 42;
          const label = row.label.length > 42 ? `${row.label.slice(0, 41)}…` : row.label;
          context.fillStyle = "#475569";
          context.font = "500 18px 'Noto Sans Thai', sans-serif";
          context.fillText(label, padding + 28, rowY);
          context.fillStyle = "#e2e8f0";
          roundedRect(context, padding + 600, rowY - 17, 650, 16, 8);
          context.fillStyle = sectionIndex % 2 ? "#e7b957" : "#0a5a95";
          roundedRect(context, padding + 600, rowY - 17, (650 * (Number(row.value) || 0)) / max, 16, 8);
          context.fillStyle = "#073c67";
          context.font = "700 18px 'Noto Sans Thai', sans-serif";
          context.textAlign = "right";
          context.fillText(`${row.value}${row.detail ? ` ${row.detail}` : ""}`, width - padding - 28, rowY);
          context.textAlign = "left";
        });
        y += sectionHeight + 28;
      }
      canvas.toBlob((blob) => {
        if (blob) download(blob, `${fileStem}.png`);
        setExporting(null);
      }, "image/png");
    } catch {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label="ส่งออกรายงาน Dashboard">
      <button
        type="button"
        onClick={exportExcel}
        disabled={exporting !== null}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-4 py-3 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-brand-soft disabled:cursor-wait disabled:opacity-60"
      >
        <i className="fa-solid fa-file-excel" aria-hidden="true" />
        {exporting === "excel" ? "กำลังสร้าง Excel..." : "Export Excel"}
      </button>
      <button
        type="button"
        onClick={exportImage}
        disabled={exporting !== null}
        className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-brand-primary/20 bg-white px-4 py-3 text-sm font-bold text-brand-primary shadow-sm transition hover:bg-brand-soft disabled:cursor-wait disabled:opacity-60"
      >
        <i className="fa-solid fa-image" aria-hidden="true" />
        {exporting === "image" ? "กำลังสร้างรูปภาพ..." : "Export รูปภาพ"}
      </button>
    </div>
  );
}
