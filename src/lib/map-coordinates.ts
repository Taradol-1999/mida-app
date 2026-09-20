export type MapCoordinates = { latitude: number; longitude: number };

const GOOGLE_MAP_HOSTS = new Set([
  "google.com",
  "www.google.com",
  "maps.google.com",
  "google.co.th",
  "www.google.co.th",
  "goo.gl",
  "maps.app.goo.gl",
]);

function valid(latitude: number, longitude: number): MapCoordinates | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 ? { latitude, longitude } : null;
}

function pair(value: string): MapCoordinates | null {
  const match = value.match(/(-?\d{1,2}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/);
  return match ? valid(Number(match[1]), Number(match[2])) : null;
}

export function coordinatesFromGoogleMaps(input: string): MapCoordinates | null {
  const value = input.trim().replaceAll("&amp;", "&");
  if (!value) return null;
  const source = value.match(/(?:src|href)=["']([^"']+)["']/i)?.[1] ?? value;
  let decoded = source;
  try {
    decoded = decodeURIComponent(source);
  } catch {}

  const at = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (at) return valid(Number(at[1]), Number(at[2]));
  const embed = decoded.match(/!3d(-?\d+(?:\.\d+)?).*?!4d(-?\d+(?:\.\d+)?)/);
  if (embed) return valid(Number(embed[1]), Number(embed[2]));
  try {
    const url = new URL(source);
    for (const key of ["q", "query", "destination", "center", "ll"]) {
      const coordinates = pair(url.searchParams.get(key) ?? "");
      if (coordinates) return coordinates;
    }
  } catch {}
  return pair(decoded);
}

function isGoogleMapsUrl(value: string) {
  try {
    return GOOGLE_MAP_HOSTS.has(new URL(value).hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function resolveGoogleMapsCoordinates(input: string): Promise<MapCoordinates | null> {
  const direct = coordinatesFromGoogleMaps(input);
  if (direct) return direct;
  const clean = input.trim().replaceAll("&amp;", "&");
  const source = clean.match(/(?:src|href)=["']([^"']+)["']/i)?.[1] ?? clean;
  if (!isGoogleMapsUrl(source)) return null;
  let url = source;
  for (let redirect = 0; redirect < 5; redirect += 1) {
    const response = await fetch(url, { method: "GET", redirect: "manual" });
    const location = response.headers.get("location");
    if (location && response.status >= 300 && response.status < 400) {
      const next = new URL(location, url).toString();
      if (!isGoogleMapsUrl(next)) return null;
      const coordinates = coordinatesFromGoogleMaps(next);
      if (coordinates) return coordinates;
      url = next;
      continue;
    }
    return coordinatesFromGoogleMaps(response.url) ?? coordinatesFromGoogleMaps(await response.text());
  }
  return null;
}
