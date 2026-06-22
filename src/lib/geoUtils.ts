export type OriginSource = "benevento" | "gps" | "custom";
export type PositionConfidence = "high" | "medium" | "low";

export interface GeoPoint {
  name: string;
  lat: number;
  lng: number;
  source?: OriginSource;
  /** Precisione GPS browser (m) — solo origine GPS */
  accuracyMeters?: number | null;
  /** Confidenza geocoding / posizione */
  positionConfidence?: PositionConfidence;
}

/** Distanza in linea d'aria (km) */
export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Stima km stradali da distanza in linea d'aria */
export function airToRoadKm(airKm: number): number {
  return Math.round(airKm * 1.28);
}

export function kmToDriveMinutes(km: number, avgSpeedKmh = 55): number {
  return Math.round((km / avgSpeedKmh) * 60);
}

export function distanceFromPoint(
  origin: GeoPoint,
  lat: number,
  lng: number
): { airKm: number; roadKm: number; driveMinutes: number } {
  const airKm = haversineKm(origin.lat, origin.lng, lat, lng);
  const roadKm = airToRoadKm(airKm);
  return {
    airKm: Math.round(airKm * 10) / 10,
    roadKm,
    driveMinutes: kmToDriveMinutes(roadKm),
  };
}

export function formatDriveFromOrigin(
  originName: string,
  minutes: number
): string {
  if (minutes < 60) return `${minutes} min da ${originName}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0
    ? `${h}h ${m}min da ${originName}`
    : `${h}h da ${originName}`;
}
