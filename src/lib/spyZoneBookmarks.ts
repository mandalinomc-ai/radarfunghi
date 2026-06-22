import type { SpyZoneMarker } from "./types";
import {
  formatCoordsExport,
  googleMapsDirUrl,
  googleMapsPinUrl,
  toGeoJsonPoint,
} from "./mapsLinkParser";

const STORAGE_KEY = "mushroomradar-spy-bookmarks";

export interface SpyZoneBookmark {
  id: string;
  spyZoneId: string;
  label: string;
  lat: number;
  lng: number;
  savedAt: string;
  note: string;
}

export function loadSpyBookmarks(): SpyZoneBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SpyZoneBookmark[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSpyBookmark(zone: SpyZoneMarker): SpyZoneBookmark {
  const list = loadSpyBookmarks();
  const entry: SpyZoneBookmark = {
    id: `bm_${zone.id}`,
    spyZoneId: zone.id,
    label: zone.label,
    lat: zone.lat,
    lng: zone.lng,
    savedAt: new Date().toISOString(),
    note: zone.note,
  };
  const next = [entry, ...list.filter((b) => b.spyZoneId !== zone.id)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return entry;
}

export function removeSpyBookmark(spyZoneId: string): void {
  const next = loadSpyBookmarks().filter((b) => b.spyZoneId !== spyZoneId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function isSpyBookmarked(spyZoneId: string): boolean {
  return loadSpyBookmarks().some((b) => b.spyZoneId === spyZoneId);
}

export function exportSpyZoneAsText(zone: SpyZoneMarker): string {
  return [
    `Zona spia: ${zone.label}`,
    `Coordinate: ${formatCoordsExport(zone.lat, zone.lng)}`,
    zone.matchedZoneName
      ? `Zona radar: ${zone.matchedZoneName} (${zone.matchDistanceKm} km)`
      : "",
    zone.note ? `Nota: ${zone.note}` : "",
    `Google Maps: ${googleMapsPinUrl(zone.lat, zone.lng, zone.label)}`,
    `Navigazione: ${googleMapsDirUrl(zone.lat, zone.lng)}`,
    `Creato: ${zone.createdAt}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function downloadSpyZoneJson(zone: SpyZoneMarker): void {
  const blob = new Blob([JSON.stringify(zone, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zona-spia-${zone.id}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadSpyZoneGeoJson(zone: SpyZoneMarker): void {
  const geo = toGeoJsonPoint(zone.lat, zone.lng, {
    label: zone.label,
    type: "spy_zone",
    id: zone.id,
  });
  const blob = new Blob([geo], { type: "application/geo+json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zona-spia-${zone.id}.geojson`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadAllBookmarks(): void {
  const list = loadSpyBookmarks();
  const blob = new Blob([JSON.stringify(list, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `mushroomradar-zone-spie-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
