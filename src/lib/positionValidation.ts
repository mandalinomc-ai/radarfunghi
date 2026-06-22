/** Validazione posizioni — Sud Italia / bbox IGM, coerenza parcheggio-bosco */

export type PositionConfidence = "high" | "medium" | "low";

/** Bounding box approssimativo Italia peninsulare + Sicilia */
export const ITALY_BBOX = {
  minLat: 36.6,
  maxLat: 47.1,
  minLng: 6.6,
  maxLng: 18.5,
} as const;

/** Area operativa MushroomRadar: Campania, Molise, Basilicata, Sannio, Matese */
export const SUD_ITALIA_BBOX = {
  minLat: 39.8,
  maxLat: 42.2,
  minLng: 13.8,
  maxLng: 16.8,
} as const;

/** Viewbox Nominatim per priorità risultati Sud */
export const SUD_ITALIA_VIEWBOX = {
  minLng: 13.8,
  minLat: 39.8,
  maxLng: 16.8,
  maxLat: 42.2,
} as const;

const R = 6371;

export function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
}

export function isWithinBBox(
  lat: number,
  lng: number,
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number }
): boolean {
  return (
    lat >= bbox.minLat &&
    lat <= bbox.maxLat &&
    lng >= bbox.minLng &&
    lng <= bbox.maxLng
  );
}

export function isWithinItaly(lat: number, lng: number): boolean {
  return isWithinBBox(lat, lng, ITALY_BBOX);
}

export function isWithinSudItalia(lat: number, lng: number): boolean {
  return isWithinBBox(lat, lng, SUD_ITALIA_BBOX);
}

/** Distanza massima plausibile parcheggio → area raccolta (m) */
export const MAX_PARKING_FORAGING_M = 4500;

/** Distanza minima parcheggio-foraging (evita marker sovrapposti per errore) */
export const MIN_PARKING_FORAGING_M = 80;

export interface CoordinateValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateZoneCoordinates(input: {
  zoneId: string;
  lat: number;
  lng: number;
  parkingLat: number;
  parkingLng: number;
  altitude: number;
}): CoordinateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const [label, lat, lng] of [
    ["foraging", input.lat, input.lng],
    ["parking", input.parkingLat, input.parkingLng],
  ] as const) {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      errors.push(`${input.zoneId}: coordinate ${label} non valide`);
      continue;
    }
    if (!isWithinItaly(lat, lng)) {
      errors.push(`${input.zoneId}: ${label} fuori dall'Italia (${lat}, ${lng})`);
    } else if (!isWithinSudItalia(lat, lng)) {
      warnings.push(`${input.zoneId}: ${label} fuori area Sud operativa`);
    }
  }

  const walkM = haversineMeters(
    input.parkingLat,
    input.parkingLng,
    input.lat,
    input.lng
  );

  if (walkM > MAX_PARKING_FORAGING_M) {
    errors.push(
      `${input.zoneId}: parcheggio troppo lontano dal bosco (${Math.round(walkM)} m > ${MAX_PARKING_FORAGING_M} m)`
    );
  } else if (walkM < MIN_PARKING_FORAGING_M) {
    warnings.push(
      `${input.zoneId}: parcheggio e bosco molto vicini (${Math.round(walkM)} m)`
    );
  }

  if (input.altitude < 200 || input.altitude > 2200) {
    warnings.push(`${input.zoneId}: quota ${input.altitude} m fuori range tipico Sud`);
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateOriginPoint(input: {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
}): CoordinateValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Number.isFinite(input.lat) || !Number.isFinite(input.lng)) {
    return { valid: false, errors: ["Coordinate origine non valide"], warnings: [] };
  }

  if (!isWithinItaly(input.lat, input.lng)) {
    errors.push("Origine fuori dall'Italia — imposta un punto in Campania/Molise/Basilicata");
  } else if (!isWithinSudItalia(input.lat, input.lng)) {
    warnings.push("Origine fuori dal raggio tipico del Radar (Sud Italia)");
  }

  if (input.accuracyMeters != null && input.accuracyMeters > 500) {
    warnings.push(
      `GPS impreciso (±${Math.round(input.accuracyMeters)} m) — distanze e tempi possono variare`
    );
  }

  return { valid: errors.length === 0, errors, warnings };
}

/** Confidenza geocoding Nominatim da tipo luogo */
export function geocodeConfidenceFromType(type: string): PositionConfidence {
  const high = new Set([
    "city",
    "town",
    "village",
    "hamlet",
    "suburb",
    "neighbourhood",
    "locality",
  ]);
  const medium = new Set([
    "administrative",
    "municipality",
    "county",
    "state",
    "region",
    "postcode",
  ]);
  if (high.has(type)) return "high";
  if (medium.has(type)) return "medium";
  return "low";
}

/** Priorità risultato Nominatim: preferisce Sud Italia e tipi precisi */
export function scoreGeocodeResult(input: {
  lat: number;
  lng: number;
  type: string;
  importance?: number;
}): number {
  let score = input.importance ?? 0.3;
  if (isWithinSudItalia(input.lat, input.lng)) score += 0.5;
  else if (isWithinItaly(input.lat, input.lng)) score += 0.1;
  else score -= 2;

  const conf = geocodeConfidenceFromType(input.type);
  if (conf === "high") score += 0.3;
  else if (conf === "medium") score += 0.1;
  else score -= 0.2;

  return score;
}
