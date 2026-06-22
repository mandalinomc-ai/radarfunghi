import type { FungalZone, MapHotspot, MushroomSpecies } from "./types";
import type { ProbabilityLevel } from "./mapUtils";
import { buildHotspots, getSpeciesLabel } from "./predictionEngine";
import {
  formatCoordinates,
  getGoogleMapsForagingLink,
  getGoogleMapsParkingLink,
  getProbabilityLevel,
} from "./mapUtils";
import { formatDateLabel } from "./dateUtils";
import { VERIFIED_ZONE_BY_ID } from "./verifiedZoneCoords";
import type { HourRange } from "./timeRange";

export interface ChatZoneResult {
  zoneId: string;
  zoneName: string;
  region: string;
  species: MushroomSpecies;
  speciesLabel: string;
  score: number;
  level: ProbabilityLevel;
  km: number;
  driveMinutes: number;
  lat: number;
  lng: number;
  parkingLat: number;
  parkingLng: number;
  altitude: number;
  forestType: string;
  mapsUrl: string;
  mapsParkingUrl: string;
  mapsForagingUrl: string;
  parkingLabel: string;
  coords: string;
  foragingCoords: string;
  date: string;
  dateLabel: string;
}

export function getParkingLabel(zoneId: string, zoneName: string): string {
  const meta = VERIFIED_ZONE_BY_ID.get(zoneId);
  if (meta?.parkingSourceLabel) {
    return meta.parkingSourceLabel.replace(/^Funghimagazine — /, "");
  }
  const short = zoneName.split("—").pop()?.trim() ?? zoneName;
  return `Parcheggio accesso ${short}`;
}

/** Risultato chat allineato 1:1 con hotspot mappa e Sprout Score live. */
export function hotspotToChatZoneResult(
  hotspot: MapHotspot,
  species: MushroomSpecies,
  date: string,
  scoreOverride?: number
): ChatZoneResult {
  const { zone } = hotspot;
  const pred = hotspot.predictions.find((p) => p.species === species);
  const score = scoreOverride ?? pred?.score ?? hotspot.activeScore;
  const parkingLabel = getParkingLabel(zone.id, zone.name);

  return {
    zoneId: zone.id,
    zoneName: zone.name,
    region: zone.region,
    species,
    speciesLabel: getSpeciesLabel(species),
    score,
    level: getProbabilityLevel(score),
    km: zone.kmFromBenevento,
    driveMinutes: zone.driveMinutesFromBenevento,
    lat: zone.lat,
    lng: zone.lng,
    parkingLat: zone.parkingLat,
    parkingLng: zone.parkingLng,
    altitude: zone.altitude,
    forestType: zone.forestType,
    mapsUrl: getGoogleMapsParkingLink(
      zone.parkingLat,
      zone.parkingLng,
      parkingLabel
    ),
    mapsParkingUrl: getGoogleMapsParkingLink(
      zone.parkingLat,
      zone.parkingLng,
      parkingLabel
    ),
    mapsForagingUrl: getGoogleMapsForagingLink(
      zone.lat,
      zone.lng,
      zone.name,
      zone.altitude
    ),
    parkingLabel,
    coords: formatCoordinates(zone.parkingLat, zone.parkingLng),
    foragingCoords: formatCoordinates(zone.lat, zone.lng),
    date,
    dateLabel: formatDateLabel(date),
  };
}

export function collectChatResultsFromHotspots(
  hotspots: MapHotspot[],
  species: MushroomSpecies | "all",
  date: string,
  minScore: number,
  limit = 8
): ChatZoneResult[] {
  const speciesList: MushroomSpecies[] =
    species === "all" ? ["porcino", "estatino", "galletto"] : [species];

  const results: ChatZoneResult[] = [];

  for (const sp of speciesList) {
    for (const h of hotspots) {
      const pred = h.predictions.find((p) => p.species === sp);
      if (!pred || pred.score < minScore) continue;
      results.push(hotspotToChatZoneResult(h, sp, date, pred.score));
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}

export function collectChatResultsFromZones(
  zones: FungalZone[],
  species: MushroomSpecies | "all",
  hourRange: HourRange,
  date: string,
  minScore: number,
  limit = 8
): ChatZoneResult[] {
  const speciesList: MushroomSpecies[] =
    species === "all" ? ["porcino", "estatino", "galletto"] : [species];

  const results: ChatZoneResult[] = [];

  for (const sp of speciesList) {
    const hotspots = buildHotspots(zones, sp, hourRange, date);
    for (const h of hotspots) {
      const pred = h.predictions.find((p) => p.species === sp);
      if (!pred || pred.score < minScore) continue;
      results.push(hotspotToChatZoneResult(h, sp, date, pred.score));
    }
  }

  return results.sort((a, b) => b.score - a.score).slice(0, limit);
}
