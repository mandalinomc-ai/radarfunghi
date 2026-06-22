import { FUNGAL_ZONES } from "./mockData";
import type { FungalZone } from "./types";
import { haversineKm } from "./geoUtils";

export interface NearestZoneMatch {
  zone: FungalZone;
  distanceKm: number;
  matchedOn: "foraging" | "parking";
}

const DEFAULT_MAX_KM = 6;

/** Zona radar più vicina al GPS del ritrovamento (area raccolta o parcheggio). */
export function findNearestZone(
  lat: number,
  lng: number,
  maxKm = DEFAULT_MAX_KM
): NearestZoneMatch | null {
  let best: NearestZoneMatch | null = null;

  for (const zone of FUNGAL_ZONES) {
    const dForaging = haversineKm(lat, lng, zone.lat, zone.lng);
    const dParking = haversineKm(lat, lng, zone.parkingLat, zone.parkingLng);

    if (dForaging <= dParking) {
      if (!best || dForaging < best.distanceKm) {
        best = {
          zone,
          distanceKm: Math.round(dForaging * 100) / 100,
          matchedOn: "foraging",
        };
      }
    } else if (!best || dParking < best.distanceKm) {
      best = {
        zone,
        distanceKm: Math.round(dParking * 100) / 100,
        matchedOn: "parking",
      };
    }
  }

  if (!best || best.distanceKm > maxKm) return null;
  return best;
}

export function speciesMatchesZone(
  zone: FungalZone,
  species: FungalZone["species"][number] | "sconosciuto"
): boolean {
  if (species === "sconosciuto") return true;
  return zone.species.includes(species);
}
