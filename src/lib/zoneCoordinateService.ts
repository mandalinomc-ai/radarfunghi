import type { FungalZone, MapHotspot } from "./types";
import type { ServiceTier } from "./tierUtils";
import { safeMapCoordinatesForTier, displayCoordinatesForTier } from "./tierUtils";
import {
  validateZoneCoordinates,
  validateOriginPoint,
  type CoordinateValidationResult,
} from "./positionValidation";
import {
  VERIFIED_ZONE_BY_ID,
  VERIFIED_COORDS_LAST_REVIEW,
  type VerifiedZoneMeta,
} from "./verifiedZoneCoords";

export { VERIFIED_COORDS_LAST_REVIEW };

export interface ZoneValidationReport {
  zoneId: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
  verified: boolean;
  sourceLabel?: string;
}

/** Le coordinate restano in mockData.ts — qui solo validazione e metadati certificati */
export function applyVerifiedCoordinates(zones: FungalZone[]): FungalZone[] {
  assertZonesValid(zones);
  return zones;
}

/** Valida tutte le zone — usato in build/simulazione */
export function validateAllZones(zones: FungalZone[]): ZoneValidationReport[] {
  return zones.map((zone) => {
    const result = validateZoneCoordinates({
      zoneId: zone.id,
      lat: zone.lat,
      lng: zone.lng,
      parkingLat: zone.parkingLat,
      parkingLng: zone.parkingLng,
      altitude: zone.altitude,
    });
    const verified = VERIFIED_ZONE_BY_ID.get(zone.id);
    return {
      zoneId: zone.id,
      valid: result.valid,
      errors: result.errors,
      warnings: result.warnings,
      verified: Boolean(verified),
      sourceLabel: verified?.foragingSourceLabel,
    };
  });
}

export function assertZonesValid(zones: FungalZone[]): void {
  const reports = validateAllZones(zones);
  const failed = reports.filter((r) => !r.valid);
  if (failed.length > 0) {
    const msg = failed
      .flatMap((r) => r.errors)
      .join("; ");
    throw new Error(`Coordinate zone non valide: ${msg}`);
  }
}

export function getVerifiedMeta(zoneId: string): VerifiedZoneMeta | undefined {
  return VERIFIED_ZONE_BY_ID.get(zoneId);
}

/** Punto mappa coerente con tier (marker = flyTo = heatmap) */
export function getHotspotMapCenter(
  hotspot: MapHotspot,
  tier: ServiceTier
): [number, number] {
  return safeMapCoordinatesForTier(
    tier,
    hotspot.zone.lat,
    hotspot.zone.lng,
    hotspot.zone.id,
    hotspot.zone.parkingLat,
    hotspot.zone.parkingLng
  );
}

/** Coordinate testuali per UI — rispetta tier free */
export function getHotspotDisplayCoordinates(
  hotspot: MapHotspot,
  tier: ServiceTier
): { foraging: string; parking: string; mapsLinkParking: string } {
  const foraging = displayCoordinatesForTier(
    tier,
    hotspot.zone.lat,
    hotspot.zone.lng,
    hotspot.zone.id,
    hotspot.zone.parkingLat,
    hotspot.zone.parkingLng
  );
  const parking = displayCoordinatesForTier(
    tier,
    hotspot.zone.parkingLat,
    hotspot.zone.parkingLng,
    `${hotspot.zone.id}-park`,
    hotspot.zone.parkingLat,
    hotspot.zone.parkingLng
  );

  const navLat = tier === "premium" ? hotspot.zone.parkingLat : parking.lat;
  const navLng = tier === "premium" ? hotspot.zone.parkingLng : parking.lng;

  return {
    foraging: foraging.label,
    parking: parking.label,
    mapsLinkParking: `https://www.google.com/maps/dir/?api=1&destination=${navLat},${navLng}&travelmode=driving`,
  };
}

export function validateUserOrigin(input: {
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
}): CoordinateValidationResult {
  return validateOriginPoint(input);
}

/** Statistiche per banner/debug */
export function getCoordinateQualityStats(zones: FungalZone[]) {
  const reports = validateAllZones(zones);
  return {
    total: zones.length,
    valid: reports.filter((r) => r.valid).length,
    verified: reports.filter((r) => r.verified).length,
    warnings: reports.reduce((n, r) => n + r.warnings.length, 0),
    lastReview: VERIFIED_COORDS_LAST_REVIEW,
  };
}
