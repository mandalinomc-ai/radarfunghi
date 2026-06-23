import type { FungalZone, MushroomSpecies, PredictionResult } from "./types";
import { calculateEnvironmentalMalus } from "./environmentalMalus";
import { assessInfestationRisk } from "./infestationEngine";
import { calculateSoilGDDGate } from "./soilGDDModel";
import { calculateFruitingShockBonus } from "./fruitingShockBonus";
import { calculateSproutScore } from "./predictionEngine";
import { getHoursInRange, type HourRange } from "./timeRange";
import { getSpeciesLabel } from "./predictionEngine";

export interface ScoreModifierLine {
  id: string;
  label: string;
  detail: string;
  impact: "bonus" | "malus" | "neutral";
  multiplier: number;
}

export interface ZoneScoreBreakdown {
  zone: FungalZone;
  species: MushroomSpecies;
  score: number;
  factors: PredictionResult["factors"];
  modifiers: ScoreModifierLine[];
}

export function buildZoneScoreBreakdown(
  zone: FungalZone,
  species: MushroomSpecies,
  hourRange: HourRange,
  selectedDate: string
): ZoneScoreBreakdown {
  const hours = getHoursInRange(hourRange);
  const predictions = hours.map((h) =>
    calculateSproutScore(zone, species, h, selectedDate)
  );
  const best = predictions.reduce((a, b) => (a.score > b.score ? a : b));

  const env = calculateEnvironmentalMalus(zone, selectedDate);
  const infestation = assessInfestationRisk(zone);
  const gdd = calculateSoilGDDGate(zone, species, selectedDate);
  const shock = calculateFruitingShockBonus(zone, selectedDate);

  const modifiers: ScoreModifierLine[] = [];

  if (env.floodMultiplier < 1) {
    modifiers.push({
      id: "flood",
      label: "Malluvione / pioggia cumulativa",
      detail: `${env.rainLast3DaysMm} mm in 3 giorni`,
      impact: "malus",
      multiplier: env.floodMultiplier,
    });
  }

  if (env.windMultiplier < 1) {
    modifiers.push({
      id: "wind",
      label: "Vento secco (evapotraspirazione)",
      detail: `${env.windyHoursLast48} ore con vento >15 km/h`,
      impact: "malus",
      multiplier: env.windMultiplier,
    });
  }

  const severeWind = zone.hourlyForecasts.slice(-48);
  let consecutive = 0;
  let maxConsecutive = 0;
  for (const f of severeWind) {
    const w = f.windSpeed ?? 0;
    const g = f.windGusts ?? 0;
    if (w > 25 || g > 30) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }
  if (maxConsecutive >= 6) {
    modifiers.push({
      id: "wind-severe",
      label: "Raffiche >25 km/h (6h+ consecutive)",
      detail: "Malus evapotraspirazione −40% per 3 giorni",
      impact: "malus",
      multiplier: 0.6,
    });
  }

  if (infestation.risk === "ALTO") {
    modifiers.push({
      id: "larve",
      label: "Rischio larve / vespatura",
      detail: infestation.alertMessage ?? "Caldo sostenuto 72h",
      impact: "malus",
      multiplier: 0.85,
    });
  }

  if (!gdd.unlocked) {
    modifiers.push({
      id: "gdd",
      label: "Gradi-giorno suolo insufficienti",
      detail: `${gdd.cumulativeGDD}/${gdd.threshold}°C cumulati post-pioggia ${gdd.rainTriggerMm}mm`,
      impact: "malus",
      multiplier: gdd.multiplier,
    });
  }

  if (shock > 1 && species === "porcino") {
    modifiers.push({
      id: "shock",
      label: "Fruiting Shock (sbalzo termico post-pioggia)",
      detail: "Calo ≥6°C in 72h → bonus porcino",
      impact: "bonus",
      multiplier: shock,
    });
  }

  if (env.pressureMultiplier !== 1) {
    modifiers.push({
      id: "pressure",
      label: "Fronte barico / pressione",
      detail: env.avgPressureHpa
        ? `Media ${env.avgPressureHpa} hPa`
        : "Variazione pressione recente",
      impact: env.pressureMultiplier > 1 ? "bonus" : "malus",
      multiplier: env.pressureMultiplier,
    });
  }

  return {
    zone,
    species,
    score: best.score,
    factors: best.factors,
    modifiers,
  };
}

export function formatBreakdownTitle(
  zoneName: string,
  species: MushroomSpecies
): string {
  return `${zoneName} · ${getSpeciesLabel(species)}`;
}
