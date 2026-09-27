"use client";

import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LineElement, LinearScale, PointElement, Tooltip);

const colors = {
  navy: "#002d62",
  blue: "#426c9e",
  gold: "#fcb040",
  mist: "#e8f0f8",
  slate: "#94a3b8",
  grid: "#dbe4ef",
};

const legend = { labels: { boxWidth: 12, boxHeight: 12, color: "#4a4a4a", font: { family: "IBM Plex Sans Thai" } } };
const scale = {
  ticks: { color: "#64748b", font: { family: "IBM Plex Sans Thai", size: 11 } },
  grid: { color: colors.grid },
  border: { display: false },
};

export function DashboardLineChart({ labels, values, label }: { labels: string[]; values: number[]; label: string }) {
  return (
    <div className="h-48">
      <Line
        data={{
          labels,
          datasets: [
            {
              label,
              data: values,
              borderColor: colors.navy,
              backgroundColor: colors.gold,
              pointBackgroundColor: colors.gold,
              pointBorderColor: colors.navy,
              pointRadius: 4,
              tension: 0.35,
              borderWidth: 3,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend },
          scales: { x: scale, y: { ...scale, beginAtZero: true } },
        }}
      />
    </div>
  );
}

export function DashboardBarChart({
  labels,
  values,
  label,
  horizontal = false,
  color = colors.navy,
}: {
  labels: string[];
  values: number[];
  label: string;
  horizontal?: boolean;
  color?: string;
}) {
  return (
    <div className="h-48">
      <Bar
        data={{
          labels,
          datasets: [
            { label, data: values, backgroundColor: color, borderRadius: 6, maxBarThickness: horizontal ? 24 : 56 },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: horizontal ? "y" : "x",
          plugins: { legend },
          scales: horizontal
            ? { x: { ...scale, beginAtZero: true }, y: { ...scale, grid: { display: false } } }
            : { x: { ...scale, grid: { display: false } }, y: { ...scale, beginAtZero: true } },
        }}
      />
    </div>
  );
}

export function DashboardDoughnutChart({
  labels,
  values,
  emptyLabel,
}: {
  labels: string[];
  values: number[];
  emptyLabel: string;
}) {
  const hasData = values.some((value) => value > 0);
  return (
    <div className="h-48">
      <Doughnut
        data={{
          labels: hasData ? labels : [emptyLabel],
          datasets: [
            {
              data: hasData ? values : [1],
              backgroundColor: hasData ? [colors.navy, colors.gold, colors.blue, colors.slate] : [colors.mist],
              borderColor: "#ffffff",
              borderWidth: 2,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: { legend: { ...legend, position: "top" } },
        }}
      />
    </div>
  );
}
