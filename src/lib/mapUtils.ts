import type { MushroomSpecies } from "./types";

export type ProbabilityLevel = "alta" | "media" | "bassa";
export type ProbabilityFilter = ProbabilityLevel | "all";

/** Rosso = bassa/niente · arancione = media · verde scuro = alta */
export const PROBABILITY_RGBA: Record<ProbabilityLevel, string> = {
  alta: "rgba(22, 101, 52, 0.8)",
  media: "rgba(234, 88, 12, 0.75)",
  bassa: "rgba(220, 38, 38, 0.7)",
};

export const PROBABILITY_LEVEL_CLASSES: Record<ProbabilityLevel, string> = {
  alta: "text-green-200 bg-green-900/55",
  media: "text-orange-300 bg-orange-600/25",
  bassa: "text-red-300 bg-red-700/40",
};

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
  { id: "alta", label: "Alta (>80%)", shortLabel: "Alta", color: PROBABILITY_RGBA.alta },
  { id: "media", label: "Media (40-80%)", shortLabel: "Media", color: PROBABILITY_RGBA.media },
  { id: "bassa", label: "Bassa (<40%)", shortLabel: "Bassa", color: PROBABILITY_RGBA.bassa },
];

export function scoreToColor(score: number): string {
  if (score >= 80) return "rgba(22, 101, 52, 0.75)";
  if (score >= 60) return "rgba(234, 88, 12, 0.65)";
  if (score >= 40) return "rgba(251, 146, 60, 0.6)";
  return "rgba(220, 38, 38, 0.55)";
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
