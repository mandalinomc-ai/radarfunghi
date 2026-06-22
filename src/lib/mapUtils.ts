import type { MushroomSpecies } from "./types";

export type ProbabilityLevel = "alta" | "media" | "bassa";
export type ProbabilityFilter = ProbabilityLevel | "all";

export function getProbabilityLevel(score: number): ProbabilityLevel {
  if (score >= 80) return "alta";
  if (score >= 40) return "media";
  return "bassa";
}

export function matchesProbabilityFilter(
  score: number,
  filter: ProbabilityFilter
): boolean {
  if (filter === "all") return true;
  return getProbabilityLevel(score) === filter;
}

export const PROBABILITY_FILTER_OPTIONS: {
  id: ProbabilityFilter;
  label: string;
  shortLabel: string;
  color: string;
}[] = [
  { id: "all", label: "Tutte", shortLabel: "Tutte", color: "rgba(148, 163, 148, 0.8)" },
  { id: "alta", label: "Alta (>80%)", shortLabel: "Alta", color: "rgba(228, 90, 30, 0.8)" },
  { id: "media", label: "Media (40-80%)", shortLabel: "Media", color: "rgba(245, 154, 74, 0.7)" },
  { id: "bassa", label: "Bassa (<40%)", shortLabel: "Bassa", color: "rgba(61, 107, 56, 0.6)" },
];

export function scoreToColor(score: number): string {
  if (score >= 80) return "rgba(228, 90, 30, 0.65)";
  if (score >= 60) return "rgba(245, 154, 74, 0.55)";
  if (score >= 40) return "rgba(122, 184, 114, 0.45)";
  return "rgba(61, 107, 56, 0.3)";
}

export function scoreToRadius(score: number): number {
  return 400 + score * 12;
}

export function getGoogleMapsDeepLink(
  lat: number,
  lng: number,
  parkingLat?: number,
  parkingLng?: number
): string {
  const destLat = parkingLat ?? lat;
  const destLng = parkingLng ?? lng;
  return getGoogleMapsParkingLink(destLat, destLng);
}

/** Navigazione stradale al parcheggio base (coordinate GPS). */
export function getGoogleMapsParkingLink(
  lat: number,
  lng: number,
  _label?: string
): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

/** Pin area raccolta / macchia boschiva (quota alta). */
export function getGoogleMapsForagingLink(
  lat: number,
  lng: number,
  zoneName: string,
  altitude?: number
): string {
  const alt = altitude ? ` ${altitude}m` : "";
  const query = encodeURIComponent(`${zoneName}${alt} ${lat.toFixed(5)},${lng.toFixed(5)}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function getGoogleMapsPinLink(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export const SPECIES_COLORS: Record<MushroomSpecies, string> = {
  estatino: "#f59a4a",
  galletto: "#7ab872",
  porcino: "#e07830",
};

export const ESRI_SATELLITE_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

/** Confini e grandi località (riferimento amministrativo) */
export const ESRI_HYBRID_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";

/** Etichette OSM: città, paesi, frazioni, strade — overlay su satellite */
export const CARTO_VOYAGER_LABELS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png";
