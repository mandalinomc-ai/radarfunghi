import type { FungalZone, MapHotspot, MushroomSpecies } from "./types";
import type { ProbabilityLevel } from "./mapUtils";
import { buildHotspots, getSpeciesLabel } from "./predictionEngine";
import {
  formatCoordinates,
  getGoogleEarthPinLink,
  getGoogleMapsForagingLink,
  getGoogleMapsParkingLink,
  getProbabilityLevel,
  roundCoord,
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
  earthParkingUrl: string;
  earthForagingUrl: string;
  parkingLabel: string;
  coords: string;
  foragingCoords: string;
  date: string;
  dateLabel: string;
  /** Fascia oraria dello studio Sprout Score */
  hourRangeLabel?: string;
  /** Timestamp meteo usato per il calcolo */
  dataAsOf?: string;
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
  scoreOverride?: number,
  meta?: { hourRangeLabel?: string; dataAsOf?: string }
): ChatZoneResult {
  const { zone } = hotspot;
  const pred = hotspot.predictions.find((p) => p.species === species);
  const score = scoreOverride ?? pred?.score ?? hotspot.activeScore;
  const parkingLabel = getParkingLabel(zone.id, zone.name);
  const parkingLat = roundCoord(zone.parkingLat);
  const parkingLng = roundCoord(zone.parkingLng);
  const foragingLat = roundCoord(zone.lat);
  const foragingLng = roundCoord(zone.lng);

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
    lat: foragingLat,
    lng: foragingLng,
    parkingLat,
    parkingLng,
    altitude: zone.altitude,
    forestType: zone.forestType,
    mapsUrl: getGoogleMapsParkingLink(parkingLat, parkingLng, parkingLabel),
    mapsParkingUrl: getGoogleMapsParkingLink(parkingLat, parkingLng, parkingLabel),
    mapsForagingUrl: getGoogleMapsForagingLink(
      foragingLat,
      foragingLng,
      zone.name,
      zone.altitude
    ),
    earthParkingUrl: getGoogleEarthPinLink(parkingLat, parkingLng),
    earthForagingUrl: getGoogleEarthPinLink(foragingLat, foragingLng),
    parkingLabel,
    coords: formatCoordinates(parkingLat, parkingLng),
    foragingCoords: formatCoordinates(foragingLat, foragingLng),
    date,
    dateLabel: formatDateLabel(date),
    hourRangeLabel: meta?.hourRangeLabel,
    dataAsOf: meta?.dataAsOf,
  };
}

export function collectChatResultsFromHotspots(
  hotspots: MapHotspot[],
  species: MushroomSpecies | "all",
  date: string,
  minScore: number,
  limit = 8,
  meta?: { hourRangeLabel?: string; dataAsOf?: string }
): ChatZoneResult[] {
  if (species === "all") {
    return hotspots
      .filter((h) => h.activeScore >= minScore)
      .map((h) =>
        hotspotToChatZoneResult(
          h,
          h.activeSpecies,
          date,
          h.activeScore,
          meta
        )
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  const results: ChatZoneResult[] = [];

  for (const h of hotspots) {
    const pred = h.predictions.find((p) => p.species === species);
    if (!pred || pred.score < minScore) continue;
    results.push(hotspotToChatZoneResult(h, species, date, pred.score, meta));
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
