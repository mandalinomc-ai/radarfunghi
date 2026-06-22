import type {
  FungalZone,
  MapHotspot,
  MushroomSpecies,
  PredictionResult,
  TerrainExposure,
} from "./types";
import { getHoursInRange, type HourRange } from "./timeRange";
import { isPastItalianDateRange, dayOffsetFromToday } from "./dateUtils";
import { calculateEnvironmentalMalus } from "./environmentalMalus";
import { getSocialBonusForRegion } from "./socialScraper";
import { getReportReliabilityMultiplier } from "./zoneReliabilityBonus";
import { getRegionalStatusForZone } from "./funghimagazineData";
import { getZoneForDate } from "./zoneWeather";
import { calculateHabitatScore } from "./speciesHabitat";
import {
  getSeasonalMultiplier,
  getSeasonalAltitudeRange,
} from "./seasonalCalendar";

const SPECIES_CONFIG: Record<
  MushroomSpecies,
  {
    label: string;
    scientificName: string;
    altitudeMin: number;
    altitudeMax: number;
    preferredExposure: TerrainExposure[];
    minThermalShock: number;
    minRainMm: number;
    optimalSoilMoisture: number;
    morningBias: boolean;
  }
> = {
  estatino: {
    label: "Estatino",
    scientificName: "Boletus aestivalis",
    altitudeMin: 400,
    altitudeMax: 1300,
    preferredExposure: ["east", "south"],
    minThermalShock: 8,
    minRainMm: 25,
    optimalSoilMoisture: 65,
    morningBias: true,
  },
  galletto: {
    label: "Galletto",
    scientificName: "Cantharellus cibarius",
    altitudeMin: 700,
    altitudeMax: 1100,
    preferredExposure: ["north", "west"],
    minThermalShock: 7,
    minRainMm: 35,
    optimalSoilMoisture: 80,
    morningBias: false,
  },
  porcino: {
    label: "Porcino",
    scientificName: "Boletus edulis / estivo",
    altitudeMin: 700,
    altitudeMax: 1500,
    preferredExposure: ["north"],
    minThermalShock: 12,
    minRainMm: 40,
    optimalSoilMoisture: 75,
    morningBias: true,
  },
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function calculateRainScore(
  rainHistory: FungalZone["rainHistory"],
  minRain: number,
  species: MushroomSpecies
): number {
  const last7 = rainHistory.slice(-7).reduce((sum, d) => sum + d.mm, 0);
  const last14 = rainHistory.reduce((sum, d) => sum + d.mm, 0);
  const recentBoost = last7 / Math.max(minRain, 1);
  const sustainedBoost = last14 / Math.max(minRain * 1.8, 1);

  if (species === "galletto") {
    return clamp(recentBoost * 32 + sustainedBoost * 38);
  }
  if (species === "estatino") {
    return clamp(recentBoost * 52 + sustainedBoost * 18);
  }
  return clamp(recentBoost * 45 + sustainedBoost * 25);
}

function calculateMoistureScore(soilMoisture: number, optimal: number): number {
  const diff = Math.abs(soilMoisture - optimal);
  return clamp(100 - diff * 2.5);
}

function calculateThermalScore(shock: number, minShock: number): number {
  if (shock < minShock) return clamp((shock / minShock) * 50);
  const excess = shock - minShock;
  return clamp(70 + excess * 4);
}

function calculateAltitudeScore(
  altitude: number,
  min: number,
  max: number
): number {
  if (altitude < min || altitude > max) {
    const distance = altitude < min ? min - altitude : altitude - max;
    return clamp(40 - distance * 0.15);
  }
  const mid = (min + max) / 2;
  const range = (max - min) / 2;
  const proximity = 1 - Math.abs(altitude - mid) / range;
  return clamp(60 + proximity * 40);
}

function calculateExposureScore(
  exposure: TerrainExposure,
  preferred: TerrainExposure[]
): number {
  if (preferred.includes(exposure)) return 95;
  const partial: Record<TerrainExposure, TerrainExposure[]> = {
    north: ["west"],
    south: ["east"],
    east: ["south"],
    west: ["north"],
  };
  if (partial[exposure]?.some((e) => preferred.includes(e))) return 65;
  return 35;
}

function calculateTimeScore(
  hour: number,
  species: MushroomSpecies,
  zone: FungalZone
): number {
  const { collectionWindow } = zone;
  const config = SPECIES_CONFIG[species];
  const currentMinutes = hour * 60;
  const startMinutes =
    collectionWindow.startHour * 60 + collectionWindow.startMinute;
  const endMinutes =
    collectionWindow.endHour * 60 + collectionWindow.endMinute;

  if (currentMinutes >= startMinutes && currentMinutes <= endMinutes) {
    return 95;
  }

  if (config.morningBias && hour >= 4 && hour <= 11) {
    const dist = Math.min(
      Math.abs(currentMinutes - startMinutes),
      Math.abs(currentMinutes - endMinutes)
    );
    return clamp(80 - dist * 0.08);
  }

  const distToWindow = Math.min(
    Math.abs(currentMinutes - startMinutes),
    Math.abs(currentMinutes - endMinutes)
  );
  return clamp(50 - distToWindow * 0.05);
}

export function calculateSproutScore(
  zone: FungalZone,
  species: MushroomSpecies,
  targetHour: number,
  selectedDate: string
): PredictionResult {
  const config = SPECIES_CONFIG[species];
  const z = getZoneForDate(zone, selectedDate);
  const dayOffset = dayOffsetFromToday(selectedDate);
  const forecast = z.hourlyForecasts[targetHour];

  const soilMoisture =
    forecast.soilMoisture + (forecast.humidity - 70) * 0.05;
  const thermalShock =
    z.nightThermalShock + (forecast.temperature < 12 ? 2 : 0);

  const rainScore = calculateRainScore(z.rainHistory, config.minRainMm, species);
  const moistureScore = calculateMoistureScore(
    soilMoisture,
    config.optimalSoilMoisture
  );
  const thermalScore = calculateThermalScore(
    thermalShock,
    config.minThermalShock
  );
  const altitudeRange =
    getSeasonalAltitudeRange(species, selectedDate, z.region) ?? {
      min: config.altitudeMin,
      max: config.altitudeMax,
    };
  const altitudeScore = calculateAltitudeScore(
    z.altitude,
    altitudeRange.min,
    altitudeRange.max
  );
  const exposureScore = calculateExposureScore(
    z.exposure,
    config.preferredExposure
  );
  const timeScore = calculateTimeScore(targetHour, species, z);
  const habitatScore = calculateHabitatScore(z, species);

  const weights = {
    rain: 0.18,
    moisture: 0.2,
    thermal: 0.16,
    altitude: 0.16,
    exposure: 0.08,
    time: 0.08,
    habitat: 0.14,
  };

  let score = clamp(
    rainScore * weights.rain +
      moistureScore * weights.moisture +
      thermalScore * weights.thermal +
      altitudeScore * weights.altitude +
      exposureScore * weights.exposure +
      timeScore * weights.time +
      habitatScore * weights.habitat
  );

  const malus = calculateEnvironmentalMalus(z, selectedDate);
  score = clamp(score * malus.combinedMultiplier);

  const seasonal = getSeasonalMultiplier(species, selectedDate, z.region);
  score = clamp(score * seasonal);

  const social = getSocialBonusForRegion(z.region);
  score = clamp(score * social.bonusMultiplier);

  const reportRel = getReportReliabilityMultiplier(z.id);
  score = clamp(score * reportRel.multiplier);

  const fmStatus = getRegionalStatusForZone(z.region, z.id);
  if (fmStatus) {
    const porciniSeasonOpen =
      !fmStatus.porciniFrom ||
      isPastItalianDateRange(fmStatus.porciniFrom, selectedDate);

    if (
      species === "porcino" &&
      fmStatus.soilStatus === "freddo" &&
      !porciniSeasonOpen
    ) {
      score = clamp(score * 0.7);
    } else if (
      species === "porcino" &&
      fmStatus.soilStatus === "freddo" &&
      porciniSeasonOpen
    ) {
      score = clamp(score * 0.9);
    }
    if (species === "galletto" && fmStatus.speciesActive.some((s) => s.includes("Galletto") || s.includes("Finferlo"))) {
      score = clamp(score * 1.12);
    }
    if (fmStatus.trafficLight === "verde") score = clamp(score * 1.08);
    if (fmStatus.trafficLight === "rosso") score = clamp(score * 0.7);
    if (dayOffset >= 3 && species === "porcino") score = clamp(score * 1.1);
  }

  return {
    zoneId: zone.id,
    species,
    score: Math.round(score),
    factors: {
      rainScore: Math.round(rainScore),
      moistureScore: Math.round(moistureScore),
      thermalScore: Math.round(thermalScore),
      altitudeScore: Math.round(altitudeScore),
      exposureScore: Math.round(exposureScore),
      timeScore: Math.round(timeScore),
    },
  };
}

export function buildHotspots(
  zones: FungalZone[],
  activeSpecies: MushroomSpecies | "all",
  hourRange: HourRange,
  selectedDate: string
): MapHotspot[] {
  const hours = getHoursInRange(hourRange);

  return zones.map((zone) => {
    const relevantSpecies =
      activeSpecies === "all"
        ? zone.species
        : zone.species.filter((s) => s === activeSpecies);

    const predictions = relevantSpecies.map((species) => {
      const hourlyPredictions = hours.map((hour) =>
        calculateSproutScore(zone, species, hour, selectedDate)
      );
      return hourlyPredictions.reduce((best, current) =>
        current.score > best.score ? current : best
      );
    });

    const best =
      predictions.length > 0
        ? predictions.reduce((a, b) => (a.score > b.score ? a : b))
        : { score: 0, species: zone.species[0] } as PredictionResult;

    return {
      zone,
      predictions,
      activeScore: best.score,
      activeSpecies: best.species,
    };
  });
}

export function getSpeciesLabel(species: MushroomSpecies): string {
  return SPECIES_CONFIG[species].label;
}

export function getSpeciesScientific(species: MushroomSpecies): string {
  return SPECIES_CONFIG[species].scientificName;
}

export { SPECIES_CONFIG };
