import type { FungalZone, MushroomSpecies } from "./types";
import { addDaysISO, dayOffsetFromToday, todayISO } from "./dateUtils";
import {
  classifySoilRetention,
  type SoilRetentionClass,
} from "./zoneSoilRetention";
import { calculateEnvironmentalMalus } from "./environmentalMalus";
import { getSeasonPhase, getMonthFromDate } from "./seasonalCalendar";

export type SoilWetnessStatus =
  | "arido"
  | "in_asciugatura"
  | "umido"
  | "ottimale"
  | "saturo"
  | "allagato";

export type DevelopmentStage =
  | "micelio_dormiente"
  | "primordi_in_formazione"
  | "fruttificazione_imminente"
  | "finestra_attiva"
  | "declino";

export type GrowthHealth = "critico" | "scarso" | "discreto" | "buono" | "ottimo";

export interface SpeciesFruitingEstimate {
  species: MushroomSpecies;
  label: string;
  daysUntilWindowStart: number;
  daysUntilWindowPeak: number;
  windowStartDate: string;
  windowPeakDate: string;
  windowEndDate: string;
  developmentStage: DevelopmentStage;
  growthHealth: GrowthHealth;
  growthHealthScore: number;
  explanation: string;
}

export interface SoilFruitingAnalysis {
  effectiveMoisturePct: number;
  wetnessStatus: SoilWetnessStatus;
  daysSinceLastRainEvent: number | null;
  lastRainEventDate: string | null;
  lastRainEventMm: number;
  retentionClass: SoilRetentionClass;
  speciesEstimates: SpeciesFruitingEstimate[];
  summary: string;
}

const SPECIES_FRUITING: Record<
  MushroomSpecies,
  {
    label: string;
    minRain7d: number;
    minRainEvent3d: number;
    optimalSoilMoisture: number;
    minLagDays: number;
    peakLagDays: number;
    maxLagDays: number;
    windowDurationDays: number;
  }
> = {
  estatino: {
    label: "Estatino",
    minRain7d: 15,
    minRainEvent3d: 10,
    optimalSoilMoisture: 65,
    minLagDays: 5,
    peakLagDays: 7,
    maxLagDays: 12,
    windowDurationDays: 5,
  },
  porcino: {
    label: "Porcino",
    minRain7d: 25,
    minRainEvent3d: 15,
    optimalSoilMoisture: 75,
    minLagDays: 7,
    peakLagDays: 10,
    maxLagDays: 16,
    windowDurationDays: 7,
  },
  galletto: {
    label: "Finferlo",
    minRain7d: 20,
    minRainEvent3d: 12,
    optimalSoilMoisture: 80,
    minLagDays: 6,
    peakLagDays: 8,
    maxLagDays: 14,
    windowDurationDays: 6,
  },
};

const RETENTION_ABSORPTION: Record<SoilRetentionClass, number> = {
  clay: 0.38,
  mixed: 0.28,
  calcareous: 0.2,
};

const RETENTION_DECAY: Record<SoilRetentionClass, number> = {
  clay: 0.55,
  mixed: 0.72,
  calcareous: 0.85,
};

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

function rainInWindow(
  history: FungalZone["rainHistory"],
  endDate: string,
  days: number
): number {
  const end = new Date(`${endDate}T12:00:00`);
  const start = new Date(end);
  start.setDate(start.getDate() - days + 1);
  const startIso = start.toISOString().slice(0, 10);
  return history
    .filter((d) => d.date >= startIso && d.date <= endDate)
    .reduce((s, d) => s + d.mm, 0);
}

export interface RainEvent {
  endDate: string;
  totalMm: number;
}

/** Ultimo evento pluviometrico significativo (finestra 3 giorni). */
export function findLastRainEvent(
  zone: FungalZone,
  beforeDate: string,
  minEventMm = 10
): RainEvent | null {
  const history = zone.rainHistory.filter((d) => d.date <= beforeDate);
  if (history.length === 0) return null;

  for (let i = history.length - 1; i >= 0; i--) {
    const endDate = history[i].date;
    const start = new Date(`${endDate}T12:00:00`);
    start.setDate(start.getDate() - 2);
    const startIso = start.toISOString().slice(0, 10);
    const total = history
      .filter((d) => d.date >= startIso && d.date <= endDate)
      .reduce((s, d) => s + d.mm, 0);
    if (total >= minEventMm) {
      return { endDate, totalMm: Math.round(total * 10) / 10 };
    }
  }
  return null;
}

/** Umidità effettiva suolo: Open-Meteo + assorbimento piogge con decadimento per tipo suolo. */
export function computeEffectiveSoilMoisture(
  zone: FungalZone,
  selectedDate: string
): number {
  const retention = classifySoilRetention(zone);
  const absorption = RETENTION_ABSORPTION[retention];
  const decay = RETENTION_DECAY[retention];
  const altFactor = 1 + (zone.altitude - 600) * 0.00015;

  let moisture = zone.baseSoilMoisture;
  const history = zone.rainHistory.filter((d) => d.date <= selectedDate);

  for (const day of history) {
    moisture += day.mm * absorption * altFactor;
    const dryPenalty =
      day.mm < 0.3 ? 2.8 * decay * altFactor : 1.2 * decay * altFactor;
    moisture -= dryPenalty;
  }

  const forecastSlice = zone.hourlyForecasts.slice(0, 24);
  if (forecastSlice.length > 0) {
    const avgHumidity =
      forecastSlice.reduce((s, f) => s + f.humidity, 0) / forecastSlice.length;
    moisture += (avgHumidity - 65) * 0.08;
  }

  return clamp(Math.round(moisture * 10) / 10);
}

export function classifySoilWetness(
  moisturePct: number,
  rainLast3d: number
): SoilWetnessStatus {
  if (rainLast3d > 100) return "allagato";
  if (moisturePct >= 88 || rainLast3d > 60) return "saturo";
  if (moisturePct >= 68) return "ottimale";
  if (moisturePct >= 52) return "umido";
  if (moisturePct >= 38) return "in_asciugatura";
  return "arido";
}

const WETNESS_LABELS: Record<SoilWetnessStatus, string> = {
  arido: "Suolo arido",
  in_asciugatura: "Suolo in asciugatura",
  umido: "Suolo umido",
  ottimale: "Umidità ottimale per micelio",
  saturo: "Suolo saturo",
  allagato: "Eccesso idrico (stasi)",
};

function scoreGrowthHealth(
  zone: FungalZone,
  selectedDate: string,
  species: MushroomSpecies,
  moisturePct: number
): { score: number; health: GrowthHealth } {
  const cfg = SPECIES_FRUITING[species];
  const malus = calculateEnvironmentalMalus(zone, selectedDate);
  const forecasts = zone.hourlyForecasts.slice(0, 12);
  const avgHumidity =
    forecasts.length > 0
      ? forecasts.reduce((s, f) => s + f.humidity, 0) / forecasts.length
      : 65;
  const avgTemp =
    forecasts.length > 0
      ? forecasts.reduce((s, f) => s + f.temperature, 0) / forecasts.length
      : 18;

  const moistureDiff = Math.abs(moisturePct - cfg.optimalSoilMoisture);
  const moistureScore = clamp(100 - moistureDiff * 2.2);
  const humidityScore = clamp((avgHumidity - 40) * 1.4);
  const tempScore =
    avgTemp >= 10 && avgTemp <= 24
      ? clamp(90 - Math.abs(avgTemp - 17) * 4)
      : clamp(45 - Math.abs(avgTemp - 17) * 3);
  const envScore = malus.combinedMultiplier * 100;

  const score = clamp(
    moistureScore * 0.35 +
      humidityScore * 0.25 +
      tempScore * 0.2 +
      envScore * 0.2
  );

  let health: GrowthHealth = "discreto";
  if (score >= 82) health = "ottimo";
  else if (score >= 68) health = "buono";
  else if (score >= 50) health = "discreto";
  else if (score >= 32) health = "scarso";
  else health = "critico";

  return { score: Math.round(score), health };
}

function estimateSpeciesFruiting(
  zone: FungalZone,
  selectedDate: string,
  species: MushroomSpecies,
  moisturePct: number,
  rainEvent: RainEvent | null
): SpeciesFruitingEstimate {
  const cfg = SPECIES_FRUITING[species];
  const month = getMonthFromDate(selectedDate);
  const seasonPhase = getSeasonPhase(species, month);
  const rain7d = rainInWindow(zone.rainHistory, selectedDate, 7);
  const { score, health } = scoreGrowthHealth(
    zone,
    selectedDate,
    species,
    moisturePct
  );

  const today = todayISO();
  const refDate = selectedDate >= today ? today : selectedDate;

  if (seasonPhase === "off") {
    return {
      species,
      label: cfg.label,
      daysUntilWindowStart: -1,
      daysUntilWindowPeak: -1,
      windowStartDate: selectedDate,
      windowPeakDate: selectedDate,
      windowEndDate: selectedDate,
      developmentStage: "micelio_dormiente",
      growthHealth: health,
      growthHealthScore: score,
      explanation: `${cfg.label}: fuori stagione fenologica al Sud.`,
    };
  }

  if (!rainEvent || rain7d < cfg.minRain7d) {
    return {
      species,
      label: cfg.label,
      daysUntilWindowStart: -1,
      daysUntilWindowPeak: -1,
      windowStartDate: selectedDate,
      windowPeakDate: selectedDate,
      windowEndDate: selectedDate,
      developmentStage: "micelio_dormiente",
      growthHealth: health,
      growthHealthScore: score,
      explanation: `Piogge insufficienti (${Math.round(rain7d)} mm/7g, serve ≥${cfg.minRain7d} mm). Micelio in attesa.`,
    };
  }

  const daysSinceRain =
    rainEvent.endDate <= refDate
      ? Math.max(0, -dayOffsetFromToday(rainEvent.endDate))
      : 0;
  const adjustedDaysSince = daysSinceRain;

  const moistureLagBonus =
    moisturePct >= cfg.optimalSoilMoisture - 5 ? 0 : 2;
  const startLag = cfg.minLagDays + moistureLagBonus;
  const peakLag = cfg.peakLagDays + moistureLagBonus;
  const endLag = cfg.maxLagDays + cfg.windowDurationDays;

  const windowStartDate = addDaysISO(rainEvent.endDate, startLag);
  const windowPeakDate = addDaysISO(rainEvent.endDate, peakLag);
  const windowEndDate = addDaysISO(rainEvent.endDate, endLag);

  const daysUntilStart = dayOffsetFromToday(windowStartDate) -
    dayOffsetFromToday(selectedDate);
  const daysUntilPeak = dayOffsetFromToday(windowPeakDate) -
    dayOffsetFromToday(selectedDate);

  let stage: DevelopmentStage = "micelio_dormiente";
  if (adjustedDaysSince >= startLag && adjustedDaysSince < peakLag) {
    stage = "primordi_in_formazione";
  } else if (adjustedDaysSince >= peakLag - 1 && adjustedDaysSince <= endLag) {
    stage =
      adjustedDaysSince <= peakLag + cfg.windowDurationDays
        ? "finestra_attiva"
        : "declino";
  } else if (daysUntilStart <= 2 && daysUntilStart >= 0) {
    stage = "fruttificazione_imminente";
  } else if (adjustedDaysSince > endLag) {
    stage = "declino";
  }

  const rainInfo = `${rainEvent.totalMm} mm (${rainEvent.endDate.slice(5)})`;
  let explanation = "";
  if (stage === "primordi_in_formazione") {
    explanation = `Dopo ${rainInfo}: primordi in formazione, picco tra ${Math.max(0, daysUntilPeak)} giorni.`;
  } else if (stage === "finestra_attiva") {
    explanation = `Finestra attiva post-${rainInfo}. Salute crescita: ${health}.`;
  } else if (stage === "fruttificazione_imminente") {
    explanation = `Suolo umido (${moisturePct}%): possibili ${cfg.label} tra ${Math.max(0, daysUntilStart)}–${Math.max(0, daysUntilPeak)} giorni.`;
  } else if (stage === "declino") {
    explanation = `Ciclo post-pioggia in declino; serve nuova doccia ≥${cfg.minRainEvent3d} mm.`;
  } else {
    explanation = `Micelio attivo; frutti attesi dal ${windowStartDate.slice(5)} (lag ${startLag}–${peakLag} gg da pioggia).`;
  }

  return {
    species,
    label: cfg.label,
    daysUntilWindowStart: daysUntilStart,
    daysUntilWindowPeak: daysUntilPeak,
    windowStartDate,
    windowPeakDate,
    windowEndDate,
    developmentStage: stage,
    growthHealth: health,
    growthHealthScore: score,
    explanation,
  };
}

export function analyzeSoilFruiting(
  zone: FungalZone,
  selectedDate: string
): SoilFruitingAnalysis {
  const retentionClass = classifySoilRetention(zone);
  const effectiveMoisturePct = computeEffectiveSoilMoisture(zone, selectedDate);
  const rainLast3d = rainInWindow(zone.rainHistory, selectedDate, 3);
  const wetnessStatus = classifySoilWetness(effectiveMoisturePct, rainLast3d);
  const rainEvent = findLastRainEvent(zone, selectedDate, 10);

  const daysSinceLastRainEvent = rainEvent
    ? Math.max(
        0,
        dayOffsetFromToday(selectedDate) -
          dayOffsetFromToday(rainEvent.endDate)
      )
    : null;

  const speciesEstimates = zone.species.map((s) =>
    estimateSpeciesFruiting(
      zone,
      selectedDate,
      s,
      effectiveMoisturePct,
      rainEvent
    )
  );

  const active = speciesEstimates.filter(
    (e) =>
      e.developmentStage !== "micelio_dormiente" &&
      e.developmentStage !== "declino"
  );
  const imminent = speciesEstimates.filter(
    (e) => e.developmentStage === "fruttificazione_imminente"
  );

  let summary = `${WETNESS_LABELS[wetnessStatus]} (${effectiveMoisturePct}%).`;
  if (rainEvent) {
    summary += ` Ultima pioggia utile: ${rainEvent.totalMm} mm, ${daysSinceLastRainEvent ?? 0} gg fa.`;
  }
  if (imminent.length > 0) {
    summary += ` Imminente: ${imminent.map((e) => e.label).join(", ")}.`;
  } else if (active.length > 0) {
    summary += ` In sviluppo: ${active.map((e) => e.label).join(", ")}.`;
  }

  return {
    effectiveMoisturePct,
    wetnessStatus,
    daysSinceLastRainEvent,
    lastRainEventDate: rainEvent?.endDate ?? null,
    lastRainEventMm: rainEvent?.totalMm ?? 0,
    retentionClass,
    speciesEstimates,
    summary,
  };
}

export function getWetnessLabel(status: SoilWetnessStatus): string {
  return WETNESS_LABELS[status];
}

export function getDevelopmentStageLabel(stage: DevelopmentStage): string {
  const labels: Record<DevelopmentStage, string> = {
    micelio_dormiente: "Micelio in attesa",
    primordi_in_formazione: "Primordi in formazione",
    fruttificazione_imminente: "Frutti imminenti",
    finestra_attiva: "Finestra di raccolta attiva",
    declino: "Ciclo in declino",
  };
  return labels[stage];
}
