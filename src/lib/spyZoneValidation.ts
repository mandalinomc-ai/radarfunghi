import type { SpyZoneMarker } from "./types";
import { findNearestZone } from "./zoneReportMatcher";

export interface SpyZoneCreateInput {
  lat: number;
  lng: number;
  label: string;
  note: string;
  sourceInput: string;
  species: SpyZoneMarker["species"];
}

export function enrichSpyZone(
  id: string,
  input: SpyZoneCreateInput
): SpyZoneMarker {
  const match = findNearestZone(input.lat, input.lng, 8);

  return {
    id,
    lat: Math.round(input.lat * 1e6) / 1e6,
    lng: Math.round(input.lng * 1e6) / 1e6,
    label: input.label.trim() || "Zona spia",
    note: input.note.trim().slice(0, 400),
    sourceInput: input.sourceInput.trim().slice(0, 2000),
    species: input.species,
    createdAt: new Date().toISOString(),
    matchedZoneId: match?.zone.id ?? null,
    matchedZoneName: match?.zone.name ?? null,
    matchDistanceKm: match?.distanceKm ?? null,
  };
}
