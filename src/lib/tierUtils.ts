export type ServiceTier = "free" | "premium";

export const FREE_MAX_DAY_OFFSET = 1;
export const PREMIUM_MAX_DAY_OFFSET = 14;
export const FREE_HOTSPOT_BLUR_KM = 1.5;

export function resolveTier(): ServiceTier {
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("mushroomradar-tier");
    if (stored === "premium") return "premium";
  }
  if (process.env.NEXT_PUBLIC_PREMIUM_TIER === "premium") return "premium";
  return "free";
}

export function isPremiumTier(tier: ServiceTier): boolean {
  return tier === "premium";
}

export function maxDayOffsetForTier(tier: ServiceTier): number {
  return tier === "premium" ? PREMIUM_MAX_DAY_OFFSET : FREE_MAX_DAY_OFFSET;
}

export interface SafeObfuscateInput {
  lat: number;
  lng: number;
  parkingLat: number;
  parkingLng: number;
  seed: string;
}

function deterministicHash(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

/**
 * Offuscamento sicuro tier free: ancorato al parcheggio/POI stradale,
 * mai coordinate casuali in burrone o fiume (audit Gemini §1.1).
 */
export function obfuscateCoordinatesSafe(
  input: SafeObfuscateInput
): { lat: number; lng: number; blurred: boolean } {
  const hash = deterministicHash(input.seed);
  const angle = ((Math.abs(hash) % 360) * Math.PI) / 180;
  const km = FREE_HOTSPOT_BLUR_KM * (0.35 + (Math.abs(hash) % 30) / 100);

  const blend = 0.55 + (Math.abs(hash) % 20) / 100;
  const anchorLat = input.parkingLat * blend + input.lat * (1 - blend);
  const anchorLng = input.parkingLng * blend + input.lng * (1 - blend);

  const dLat = (km / 111) * Math.cos(angle);
  const dLng =
    (km / (111 * Math.cos((anchorLat * Math.PI) / 180))) * Math.sin(angle);

  return {
    lat: Math.round((anchorLat + dLat) * 10000) / 10000,
    lng: Math.round((anchorLng + dLng) * 10000) / 10000,
    blurred: true,
  };
}

/** @deprecated prefer obfuscateCoordinatesSafe with parking anchor */
export function obfuscateCoordinates(
  lat: number,
  lng: number,
  seed: string
): { lat: number; lng: number; blurred: boolean } {
  return obfuscateCoordinatesSafe({
    lat,
    lng,
    parkingLat: lat,
    parkingLng: lng,
    seed,
  });
}

export function displayCoordinatesForTier(
  tier: ServiceTier,
  lat: number,
  lng: number,
  zoneId: string,
  parkingLat?: number,
  parkingLng?: number
): { lat: number; lng: number; label: string } {
  if (isPremiumTier(tier)) {
    return { lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` };
  }
  const o = obfuscateCoordinatesSafe({
    lat,
    lng,
    parkingLat: parkingLat ?? lat,
    parkingLng: parkingLng ?? lng,
    seed: zoneId,
  });
  return {
    lat: o.lat,
    lng: o.lng,
    label: `Area ~${o.lat.toFixed(3)}, ${o.lng.toFixed(3)} (parcheggio ±${FREE_HOTSPOT_BLUR_KM} km)`,
  };
}

export function safeMapCoordinatesForTier(
  tier: ServiceTier,
  lat: number,
  lng: number,
  zoneId: string,
  parkingLat: number,
  parkingLng: number
): [number, number] {
  if (isPremiumTier(tier)) return [lat, lng];
  const o = obfuscateCoordinatesSafe({
    lat,
    lng,
    parkingLat,
    parkingLng,
    seed: zoneId,
  });
  return [o.lat, o.lng];
}
