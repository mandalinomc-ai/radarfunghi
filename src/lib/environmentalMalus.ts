import type { FungalZone } from "./types";
import { floodRecoveryRatePerDay } from "./zoneSoilRetention";

export interface EnvironmentalMalusResult {
  floodMultiplier: number;
  windMultiplier: number;
  combinedMultiplier: number;
  rainLast3DaysMm: number;
  windyHoursLast48: number;
}

function rainLastNDays(zone: FungalZone, days: number, beforeDate: string): number {
  const cutoff = new Date(`${beforeDate}T12:00:00`);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return zone.rainHistory
    .filter((d) => d.date >= cutoffIso && d.date <= beforeDate)
    .reduce((s, d) => s + d.mm, 0);
}

function dryDaysAfterFlood(zone: FungalZone, beforeDate: string): number {
  let count = 0;
  for (let i = zone.rainHistory.length - 1; i >= 0; i--) {
    const entry = zone.rainHistory[i];
    if (entry.date > beforeDate) continue;
    if (entry.mm > 0.5) break;
    count++;
  }
  return count;
}

/** Malluvione — pioggia >100mm in 3 giorni → ×0.30, recovery per tipo suolo */
export function calculateFloodMalus(
  zone: FungalZone,
  selectedDate: string
): number {
  const rain3d = rainLastNDays(zone, 3, selectedDate);
  if (rain3d <= 100) return 1;

  const dryDays = dryDaysAfterFlood(zone, selectedDate);
  const dailyRecovery = floodRecoveryRatePerDay(zone);
  const recovery = Math.min(0.7, dryDays * dailyRecovery);
  return Math.min(1, 0.3 + recovery);
}

/** Vento — FM: inibitore n.1 delle nascite (asciuga superficie suolo) */
export function calculateWindMalus(zone: FungalZone): number {
  const recent = zone.hourlyForecasts.slice(-48);
  const windyHours = recent.filter(
    (f) => (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 15
  ).length;
  const moderateWind = recent.filter(
    (f) => (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 10
  ).length;

  if (windyHours > 6) return 0.6;
  if (windyHours > 3) return 0.75;
  if (moderateWind > 12) return 0.88;
  return 1;
}

function estimateWindFromHumidity(humidity: number): number {
  return Math.max(4, 28 - humidity * 0.22);
}

export function calculateEnvironmentalMalus(
  zone: FungalZone,
  selectedDate: string
): EnvironmentalMalusResult {
  const floodMultiplier = calculateFloodMalus(zone, selectedDate);
  const windMultiplier = calculateWindMalus(zone);
  const rainLast3DaysMm = rainLastNDays(zone, 3, selectedDate);
  const windyHoursLast48 = zone.hourlyForecasts
    .slice(-48)
    .filter(
      (f) => (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 15
    ).length;

  return {
    floodMultiplier,
    windMultiplier,
    combinedMultiplier: floodMultiplier * windMultiplier,
    rainLast3DaysMm: Math.round(rainLast3DaysMm * 10) / 10,
    windyHoursLast48,
  };
}
