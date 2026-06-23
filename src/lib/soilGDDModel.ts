import type { FungalZone, MushroomSpecies } from "./types";

/** Gradi-giorno suolo richiesti per sbloccare fruttificazione post-pioggia */
export const SPECIES_GDD_THRESHOLD: Record<MushroomSpecies, number> = {
  porcino: 120,
  galletto: 100,
  estatino: 90,
};

const RAIN_TRIGGER_MM = 15;
const GDD_WINDOW_DAYS = 10;

export interface SoilGDDResult {
  unlocked: boolean;
  cumulativeGDD: number;
  threshold: number;
  multiplier: number;
  rainTriggerDate: string | null;
  rainTriggerMm: number;
}

function dailySoilGDD(soilMoisture: number, airTemp: number): number {
  const base = Math.max(0, airTemp - 5);
  const moistureFactor = Math.min(1.2, 0.65 + soilMoisture / 200);
  return base * moistureFactor;
}

/** Modello GDD: somma termica suolo nei 10 gg dopo pioggia >15mm */
export function calculateSoilGDDGate(
  zone: FungalZone,
  species: MushroomSpecies,
  selectedDate: string
): SoilGDDResult {
  const threshold = SPECIES_GDD_THRESHOLD[species];
  const history = [...zone.rainHistory].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  let rainTriggerDate: string | null = null;
  let rainTriggerMm = 0;

  for (let i = history.length - 1; i >= 0; i--) {
    const entry = history[i];
    if (entry.date > selectedDate) continue;
    if (entry.mm >= RAIN_TRIGGER_MM) {
      rainTriggerDate = entry.date;
      rainTriggerMm = entry.mm;
      break;
    }
  }

  if (!rainTriggerDate) {
    return {
      unlocked: true,
      cumulativeGDD: threshold,
      threshold,
      multiplier: 1,
      rainTriggerDate: null,
      rainTriggerMm: 0,
    };
  }

  const start = new Date(`${rainTriggerDate}T12:00:00`);
  const end = new Date(`${selectedDate}T12:00:00`);
  let cumulative = 0;
  let cursor = new Date(start);
  cursor.setDate(cursor.getDate() + 1);

  while (cursor <= end && cumulative < threshold * 2) {
    const daysSince =
      (cursor.getTime() - start.getTime()) / (86400000);
    if (daysSince > GDD_WINDOW_DAYS) break;

    const iso = cursor.toISOString().slice(0, 10);
    const rainEntry = history.find((h) => h.date === iso);
    const avgTemp =
      zone.hourlyForecasts.reduce((s, f) => s + f.temperature, 0) /
      Math.max(1, zone.hourlyForecasts.length);
    const moisture =
      rainEntry && rainEntry.mm > 0
        ? Math.min(95, zone.baseSoilMoisture + rainEntry.mm * 0.8)
        : zone.baseSoilMoisture;

    cumulative += dailySoilGDD(moisture, avgTemp);
    cursor.setDate(cursor.getDate() + 1);
  }

  const unlocked = cumulative >= threshold;
  const ratio = Math.min(1, cumulative / threshold);

  return {
    unlocked,
    cumulativeGDD: Math.round(cumulative * 10) / 10,
    threshold,
    multiplier: unlocked ? 1 : Math.max(0.35, 0.35 + ratio * 0.45),
    rainTriggerDate,
    rainTriggerMm,
  };
}
