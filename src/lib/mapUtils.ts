import type { MushroomSpecies } from "./types";

export type ProbabilityLevel = "alta" | "media" | "bassa";
export type ProbabilityFilter = ProbabilityLevel | "all";

/** Verde scuro alta · arancione media · rosso bassa/niente */
export const PROBABILITY_RGBA: Record<ProbabilityLevel, string> = {
  alta: "rgba(22, 101, 52, 0.8)",
  media: "rgba(234, 88, 12, 0.75)",
  bassa: "rgba(239, 68, 68, 0.78)",
};

export const PROBABILITY_LEVEL_CLASSES: Record<ProbabilityLevel, string> = {
  alta: "text-green-200 bg-green-900/55",
  media: "text-orange-300 bg-orange-600/25",
  bassa: "text-red-200 bg-red-600/35",
};

export const PROBABILITY_LEVEL_TEXT: Record<ProbabilityLevel, string> = {
  alta: "text-green-200",
  media: "text-orange-300",
  bassa: "text-red-200",
};

export const PROBABILITY_LEVEL_LABELS: Record<ProbabilityLevel, string> = {
  alta: "Alta",
  media: "Media",
  bassa: "Bassa",
};

export const PROBABILITY_LEGEND: { label: string; color: string }[] = [
  { label: "Alta (≥80%)", color: PROBABILITY_RGBA.alta },
  { label: "Media (40–79%)", color: PROBABILITY_RGBA.media },
  { label: "Bassa / niente (<40%)", color: PROBABILITY_RGBA.bassa },
];

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
  {
    id: "alta",
    label: "Alta (≥80%)",
    shortLabel: "Alta",
    color: PROBABILITY_RGBA.alta,
  },
  { id: "media", label: "Media (40–79%)", shortLabel: "Media", color: PROBABILITY_RGBA.media },
  {
    id: "bassa",
    label: "Bassa (<40%)",
    shortLabel: "Bassa",
    color: PROBABILITY_RGBA.bassa,
  },
];

export function scoreToColor(score: number): string {
  if (score >= 80) return "rgba(22, 101, 52, 0.55)";
  if (score >= 60) return "rgba(234, 88, 12, 0.45)";
  if (score >= 40) return "rgba(251, 146, 60, 0.42)";
  if (score >= 20) return "rgba(239, 68, 68, 0.5)";
  return "rgba(185, 28, 28, 0.55)";
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

/** Decimali GPS — identici in UI, Maps e Earth (~1 m) */
export const COORD_DECIMALS = 5;

export function roundCoord(value: number): number {
  const f = 10 ** COORD_DECIMALS;
  return Math.round(value * f) / f;
}

export interface GpsLinkBundle {
  lat: number;
  lng: number;
  display: string;
  copyPaste: string;
  mapsPin: string;
  mapsDir: string;
  earthPin: string;
  geoUri: string;
}

/** Coordinate + link allineati Maps / Earth / geo URI */
export function buildGpsLinks(lat: number, lng: number): GpsLinkBundle {
  const la = roundCoord(lat);
  const ln = roundCoord(lng);
  const pair = `${la.toFixed(COORD_DECIMALS)},${ln.toFixed(COORD_DECIMALS)}`;
  const display = `${la.toFixed(COORD_DECIMALS)}, ${ln.toFixed(COORD_DECIMALS)}`;
  return {
    lat: la,
    lng: ln,
    display,
    copyPaste: display,
    mapsPin: `https://www.google.com/maps/search/?api=1&query=${pair}`,
    mapsDir: `https://www.google.com/maps/dir/?api=1&destination=${pair}&travelmode=driving`,
    earthPin: `https://earth.google.com/web/search/${pair}`,
    geoUri: `geo:${pair}?q=${pair}`,
  };
}

/** Navigazione stradale al parcheggio base (coordinate GPS esatte). */
export function getGoogleMapsParkingLink(
  lat: number,
  lng: number,
  _label?: string
): string {
  return buildGpsLinks(lat, lng).mapsDir;
}

/** Pin esatto area raccolta — stesso punto su Maps e Earth */
export function getGoogleMapsForagingLink(
  lat: number,
  lng: number,
  _zoneName?: string,
  _altitude?: number
): string {
  return buildGpsLinks(lat, lng).mapsPin;
}

export function getGoogleMapsPinLink(lat: number, lng: number): string {
  return buildGpsLinks(lat, lng).mapsPin;
}

export function getGoogleEarthPinLink(lat: number, lng: number): string {
  return buildGpsLinks(lat, lng).earthPin;
}

export function formatCoordinates(lat: number, lng: number): string {
  return buildGpsLinks(lat, lng).display;
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
