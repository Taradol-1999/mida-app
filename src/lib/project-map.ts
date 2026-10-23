export type MapProject = {
  id?: string;
  slug: string;
  name: string;
  nameEn?: string | null;
  location: string;
  locationEn?: string | null;
  latitude: number | null;
  longitude: number | null;
  mapUrl?: string | null;
};

export function googleMapsEmbedUrl(project: MapProject) {
  const raw = project.mapUrl?.trim() ?? "";
  const source = raw.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1] ?? raw;
  try {
    const url = new URL(source.replace(/&amp;/g, "&"));
    if (
      url.protocol === "https:" &&
      ["www.google.com", "google.com", "maps.google.com"].includes(url.hostname) &&
      url.pathname.startsWith("/maps/embed")
    )
      return url.href;
  } catch {
    /* Ordinary map links use the saved coordinates or address below. */
  }
  const query =
    project.latitude !== null &&
    project.longitude !== null &&
    Number.isFinite(project.latitude) &&
    Number.isFinite(project.longitude)
      ? `${project.latitude},${project.longitude}`
      : `${project.name} ${project.location}`;
  return `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
}

export function directionsUrl(project: MapProject) {
  if (project.mapUrl && /^https:\/\/(www\.)?google\.[^/]+\/maps|^https:\/\/maps\.app\.goo\.gl/.test(project.mapUrl)) {
    return project.mapUrl;
  }
  const destination =
    project.latitude !== null && project.longitude !== null
      ? `${project.latitude},${project.longitude}`
      : `${project.name} ${project.location}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}
