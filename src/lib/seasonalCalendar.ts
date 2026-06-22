import type { FungalZone, MushroomSpecies } from "./types";

export type SeasonPhase = "peak" | "active" | "emerging" | "low" | "off";

export interface SeasonalSpeciesWindow {
  species: MushroomSpecies;
  months: number[];
  peakMonths: number[];
  altitudeMinSouth: number;
  altitudeMaxSouth: number;
  label: string;
  source: string;
}

/** Fenologia Sud Italia — da Funghimagazine calendario porcini + guide FM */
export const SOUTH_ITALY_SEASONAL_WINDOWS: SeasonalSpeciesWindow[] = [
  {
    species: "estatino",
    months: [4, 5, 6, 7, 8, 9, 10],
    peakMonths: [5, 6, 9],
    altitudeMinSouth: 400,
    altitudeMaxSouth: 1400,
    label: "Porcino estivo (B. aestivalis)",
    source: "Funghimagazine — Boletus aestivalis",
  },
  {
    species: "porcino",
    months: [5, 6, 7, 8, 9, 10, 11],
    peakMonths: [6, 7, 10, 11],
    altitudeMinSouth: 700,
    altitudeMaxSouth: 1500,
    label: "Porcino (estivo/autunnale al Sud)",
    source: "Funghimagazine — Calendario porcini",
  },
  {
    species: "galletto",
    months: [4, 5, 6, 7, 8, 9, 10, 11],
    peakMonths: [5, 6, 9, 10],
    altitudeMinSouth: 500,
    altitudeMaxSouth: 1300,
    label: "Finferlo (Cantharellus cibarius)",
    source: "Funghimagazine — Meteofunghi Sud",
  },
];

const SOUTH_REGIONS = new Set<FungalZone["region"]>([
  "campania",
  "sannio",
  "taburno",
  "matese",
  "molise",
  "basilicata",
]);

export function getMonthFromDate(isoDate: string): number {
  return new Date(`${isoDate}T12:00:00`).getMonth() + 1;
}

export function getSeasonPhase(
  species: MushroomSpecies,
  month: number
): SeasonPhase {
  const window = SOUTH_ITALY_SEASONAL_WINDOWS.find((w) => w.species === species);
  if (!window) return "active";
  if (!window.months.includes(month)) return "off";
  if (window.peakMonths.includes(month)) return "peak";
  if (month === window.months[0] || month === window.months[window.months.length - 1])
    return "emerging";
  return "active";
}

export function getSeasonalMultiplier(
  species: MushroomSpecies,
  selectedDate: string,
  region: FungalZone["region"]
): number {
  if (!SOUTH_REGIONS.has(region)) return 1;
  const month = getMonthFromDate(selectedDate);
  const phase = getSeasonPhase(species, month);
  switch (phase) {
    case "peak":
      return 1.08;
    case "active":
      return 1;
    case "emerging":
      return 0.88;
    case "low":
      return 0.75;
    case "off":
      return 0.55;
    default:
      return 1;
  }
}

export function getSeasonalAltitudeRange(
  species: MushroomSpecies,
  selectedDate: string,
  region: FungalZone["region"]
): { min: number; max: number } | null {
  if (!SOUTH_REGIONS.has(region)) return null;
  const window = SOUTH_ITALY_SEASONAL_WINDOWS.find((w) => w.species === species);
  if (!window) return null;
  const month = getMonthFromDate(selectedDate);
  if (!window.months.includes(month)) return null;
  return { min: window.altitudeMinSouth, max: window.altitudeMaxSouth };
}

export function getSpeciesInSeasonForMonth(month: number): {
  peak: MushroomSpecies[];
  active: MushroomSpecies[];
  off: MushroomSpecies[];
} {
  const peak: MushroomSpecies[] = [];
  const active: MushroomSpecies[] = [];
  const off: MushroomSpecies[] = [];

  for (const w of SOUTH_ITALY_SEASONAL_WINDOWS) {
    const phase = getSeasonPhase(w.species, month);
    if (phase === "peak") peak.push(w.species);
    else if (phase === "off") off.push(w.species);
    else active.push(w.species);
  }

  return { peak, active, off };
}

export const MONTH_NAMES_IT = [
  "",
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];
