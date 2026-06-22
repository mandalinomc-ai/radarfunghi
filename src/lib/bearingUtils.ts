import type { GeoPoint } from "./geoUtils";
import { haversineKm, airToRoadKm, kmToDriveMinutes } from "./geoUtils";

/** Bearing in gradi (0–360, 0 = Nord) da punto A verso B */
export function computeBearingDeg(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

function toDegrees(rad: number): number {
  return (rad * 180) / Math.PI;
}

/** Etichetta cardinale o intercardinale */
export function bearingToCardinal(deg: number): string {
  const dirs = [
    "Nord",
    "Nord-Est",
    "Est",
    "Sud-Est",
    "Sud",
    "Sud-Ovest",
    "Ovest",
    "Nord-Ovest",
  ];
  const idx = Math.round(deg / 45) % 8;
  return dirs[idx];
}

export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

/** Angolo relativo da guardare (0 = dritto verso target) */
export function relativeBearingToTarget(
  deviceHeadingDeg: number,
  targetBearingDeg: number
): number {
  return normalizeAngle(targetBearingDeg - deviceHeadingDeg);
}

export interface NavigationSummary {
  bearingDeg: number;
  cardinal: string;
  distanceKm: number;
  driveMinutes: number;
}

export function buildNavigationSummary(
  from: GeoPoint,
  toLat: number,
  toLng: number
): NavigationSummary {
  const bearingDeg = Math.round(
    computeBearingDeg(from.lat, from.lng, toLat, toLng)
  );
  const airKm = haversineKm(from.lat, from.lng, toLat, toLng);
  const roadKm = airToRoadKm(airKm);
  return {
    bearingDeg,
    cardinal: bearingToCardinal(bearingDeg),
    distanceKm: Math.round(roadKm * 10) / 10,
    driveMinutes: kmToDriveMinutes(roadKm),
  };
}
