import type { MushroomSpecies } from "./types";

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
  return `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}&travelmode=driving`;
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

export const ESRI_HYBRID_LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
