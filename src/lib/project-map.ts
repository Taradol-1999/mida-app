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
