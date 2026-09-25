"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { directionsUrl, type MapProject } from "@/lib/project-map";

type MapCenter = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

function escapeHtml(value: string) {
  return value.replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!,
  );
}

export function ProjectLocationMap({ projects, center }: { projects: MapProject[]; center?: MapCenter }) {
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!mapElement.current || mapInstance.current) return;
    let disposed = false;

    void import("leaflet").then((leafletModule) => {
      if (disposed || !mapElement.current) return;
      const L = leafletModule.default;
      const projectLocations = projects.filter(
        (project) =>
          project.latitude !== null &&
          project.longitude !== null &&
          Number.isFinite(project.latitude) &&
          Number.isFinite(project.longitude),
      );
      const initialPosition: [number, number] = center
        ? [center.latitude, center.longitude]
        : projectLocations.length
          ? [Number(projectLocations[0].latitude), Number(projectLocations[0].longitude)]
          : [13.7563, 100.5018];
      const map = L.map(mapElement.current, {
        center: initialPosition,
        zoom: center ? 7 : 15,
        scrollWheelZoom: false,
      });
      mapInstance.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      if (center) {
        const centerIcon = L.divIcon({
          className: "mida-map-icon",
          html: '<span class="mida-map-pin mida-map-pin--center">M</span>',
          iconSize: [46, 54],
          iconAnchor: [23, 52],
          popupAnchor: [0, -48],
        });
        L.marker([center.latitude, center.longitude], { icon: centerIcon, zIndexOffset: 1000 })
          .addTo(map)
          .bindPopup(
            `<div class="mida-map-popup"><strong>${escapeHtml(center.name)}</strong><span>${escapeHtml(center.address)}</span></div>`,
          );
      }

      projectLocations.forEach((project) => {
        const projectIcon = L.divIcon({
          className: "mida-map-icon",
          html: `<span class="mida-map-label"><i class="fa-solid fa-location-dot"></i><b>${escapeHtml(project.name)}</b></span>`,
          iconSize: [190, 44],
          iconAnchor: [20, 42],
          popupAnchor: [0, -42],
        });
        L.marker([Number(project.latitude), Number(project.longitude)], { icon: projectIcon })
          .addTo(map)
          .bindPopup(
            `<div class="mida-map-popup"><strong>${escapeHtml(project.name)}</strong><span>${escapeHtml(project.location)}</span><a href="${escapeHtml(directionsUrl(project))}" target="_blank" rel="noreferrer">นำทางด้วย Google Maps</a></div>`,
          );
      });
    });

    return () => {
      disposed = true;
      mapInstance.current?.remove();
      mapInstance.current = null;
    };
  }, [center, projects]);

  return (
    <div className="relative isolate z-0 overflow-hidden rounded-2xl border border-brand-primary/15 bg-white shadow-sm">
      {center && (
        <div className="flex items-center gap-3 border-b border-brand-primary/10 bg-brand-primary px-5 py-4 text-white">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white font-black text-brand-primary">
            M
          </span>
          <span className="text-sm">
            <strong className="block">{center.name} · จุดศูนย์กลาง</strong>
            <span className="text-xs text-white/75">{center.address}</span>
          </span>
        </div>
      )}
      <div ref={mapElement} className="h-112 w-full" aria-label="OpenStreetMap แสดงตำแหน่งโครงการ" />
    </div>
  );
}
