import type { MapHotspot, MushroomSpecies } from "./types";
import { getSpeciesLabel } from "./predictionEngine";
import { getHoursInRange, type HourRange } from "./timeRange";
import { assessInfestationRisk } from "./infestationEngine";
import { getSocialBonusForRegion } from "./socialScraper";
import { getParkingLabel } from "./chatZoneResults";

/** Payload hotspot per il Mastro Fungaiolo (serializzabile in Server Action) */
export interface MastroHotspotPayload {
  id: string;
  name: string;
  region: string;
  /** Area raccolta in bosco */
  foragingLat: number;
  foragingLng: number;
  /** Parcheggio base — navigazione stradale */
  parkingLat: number;
  parkingLng: number;
  parkingLabel: string;
  altitude: number;
  forestType: string;
  lat: number;
  lng: number;
  sproutScore: number;
  windSpeed?: number;
  soilMoisture?: number;
  temperature?: number;
  species?: string[];
  distanceKm?: number;
  travelTimeMin?: number;
  socialTrendActive?: boolean;
  infestationRisk?: "BASSO" | "MEDIO" | "ALTO";
}

function avgTemperatureInWindow(
  hotspot: MapHotspot,
  hourRange: HourRange
): number | undefined {
  const hours = getHoursInRange(hourRange);
  const forecasts = hotspot.zone.hourlyForecasts.filter((f) =>
    hours.includes(f.hour)
  );
  if (forecasts.length === 0) return undefined;
  const sum = forecasts.reduce((acc, f) => acc + f.temperature, 0);
  return Math.round((sum / forecasts.length) * 10) / 10;
}

function avgWindInWindow(
  hotspot: MapHotspot,
  hourRange: HourRange
): number | undefined {
  const hours = getHoursInRange(hourRange);
  const forecasts = hotspot.zone.hourlyForecasts.filter((f) =>
    hours.includes(f.hour)
  );
  if (forecasts.length === 0) return undefined;
  const sum = forecasts.reduce(
    (acc, f) => acc + (f.windSpeed ?? estimateWindFromHumidity(f.humidity)),
    0
  );
  return Math.round((sum / forecasts.length) * 10) / 10;
}

function estimateWindFromHumidity(humidity: number): number {
  return Math.round(Math.max(4, 28 - humidity * 0.22));
}

function speciesLabels(hotspot: MapHotspot): string[] {
  const fromPredictions = hotspot.predictions.map((p) =>
    getSpeciesLabel(p.species)
  );
  const fromZone = hotspot.zone.species.map(getSpeciesLabel);
  return [...new Set([...fromPredictions, ...fromZone])];
}

/** Converte MapHotspot[] → payload Mastro con meteo e trend social */
export function mapHotspotsToMastroPayload(
  hotspots: MapHotspot[],
  hourRange: HourRange
): MastroHotspotPayload[] {
  return hotspots
    .map((h) => {
      const soilMoisture = Math.round(h.zone.baseSoilMoisture * 10) / 10;
      const temperature = avgTemperatureInWindow(h, hourRange);
      const windSpeed = avgWindInWindow(h, hourRange);
      const infestation = assessInfestationRisk(h.zone);
      const social = getSocialBonusForRegion(h.zone.region);

      return {
        id: h.zone.id,
        name: h.zone.name,
        region: h.zone.region,
        foragingLat: h.zone.lat,
        foragingLng: h.zone.lng,
        parkingLat: h.zone.parkingLat,
        parkingLng: h.zone.parkingLng,
        parkingLabel: getParkingLabel(h.zone.id, h.zone.name),
        altitude: h.zone.altitude,
        forestType: h.zone.forestType,
        lat: h.zone.lat,
        lng: h.zone.lng,
        sproutScore: h.activeScore,
        windSpeed,
        soilMoisture,
        temperature,
        species: speciesLabels(h),
        distanceKm: h.zone.kmFromBenevento,
        travelTimeMin: h.zone.driveMinutesFromBenevento,
        socialTrendActive: social.socialTrendActive,
        infestationRisk: infestation.risk,
      };
    })
    .sort((a, b) => b.sproutScore - a.sproutScore);
}

export function mastroPayloadToSpecies(
  payload: MastroHotspotPayload,
  fallback: MushroomSpecies
): MushroomSpecies {
  const joined = (payload.species ?? []).join(" ").toLowerCase();
  if (joined.includes("porcino")) return "porcino";
  if (joined.includes("estatino")) return "estatino";
  if (joined.includes("galletto") || joined.includes("finferl")) {
    return "galletto";
  }
  return fallback;
}
