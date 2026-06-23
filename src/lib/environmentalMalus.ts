import type { FungalZone } from "./types";
import { floodRecoveryRatePerDay } from "./zoneSoilRetention";

export interface EnvironmentalMalusResult {
  floodMultiplier: number;
  windMultiplier: number;
  severeWindMultiplier: number;
  pressureMultiplier: number;
  combinedMultiplier: number;
  rainLast3DaysMm: number;
  windyHoursLast48: number;
  avgPressureHpa?: number;
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
    (f) =>
      (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 15 ||
      (f.windGusts ?? 0) > 22
  ).length;
  const moderateWind = recent.filter(
    (f) =>
      (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 10 ||
      (f.windGusts ?? 0) > 16
  ).length;

  if (windyHours > 6) return 0.6;
  if (windyHours > 3) return 0.75;
  if (moderateWind > 12) return 0.88;
  return 1;
}

/** Vento forte >25 km/h per 6+ ore consecutive → malus 40% (×0.60) */
export function calculateSevereWindEvapMalus(zone: FungalZone): number {
  const recent = zone.hourlyForecasts.slice(-72);
  let consecutive = 0;
  let maxConsecutive = 0;

  for (const f of recent) {
    const speed = f.windSpeed ?? estimateWindFromHumidity(f.humidity);
    const gust = f.windGusts ?? 0;
    if (speed > 25 || gust > 30) {
      consecutive++;
      maxConsecutive = Math.max(maxConsecutive, consecutive);
    } else {
      consecutive = 0;
    }
  }

  if (maxConsecutive >= 6) return 0.6;
  return 1;
}

/**
 * Pressione + nuvolosità — fronti in arrivo (pressione in calo) favoriscono umidità;
 * alta pressione prolungata + cielo sereno asciuga il letto fogliare.
 */
export function calculatePressureMalus(zone: FungalZone): number {
  const recent = zone.hourlyForecasts.slice(-24);
  if (recent.length < 4) return 1;

  const pressures = recent
    .map((f) => f.surfacePressure)
    .filter((p): p is number => typeof p === "number");
  if (pressures.length < 4) return 1;

  const avg = pressures.reduce((a, b) => a + b, 0) / pressures.length;
  const delta = pressures[pressures.length - 1] - pressures[0];
  const avgCloud =
    recent
      .map((f) => f.cloudCover ?? 50)
      .reduce((a, b) => a + b, 0) / recent.length;

  if (delta <= -4 && avgCloud > 45) return 1.06;
  if (delta <= -2) return 1.03;
  if (avg > 1022 && avgCloud < 25) return 0.92;
  if (avg > 1018 && avgCloud < 15) return 0.96;
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
  const severeWindMultiplier = calculateSevereWindEvapMalus(zone);
  const pressureMultiplier = calculatePressureMalus(zone);
  const rainLast3DaysMm = rainLastNDays(zone, 3, selectedDate);
  const windyHoursLast48 = zone.hourlyForecasts
    .slice(-48)
    .filter(
      (f) =>
        (f.windSpeed ?? estimateWindFromHumidity(f.humidity)) > 15 ||
        (f.windGusts ?? 0) > 22
    ).length;

  const pressures = zone.hourlyForecasts
    .slice(-24)
    .map((f) => f.surfacePressure)
    .filter((p): p is number => typeof p === "number");
  const avgPressureHpa =
    pressures.length > 0
      ? Math.round(
          (pressures.reduce((a, b) => a + b, 0) / pressures.length) * 10
        ) / 10
      : undefined;

  return {
    floodMultiplier,
    windMultiplier,
    severeWindMultiplier,
    pressureMultiplier,
    combinedMultiplier:
      floodMultiplier * windMultiplier * severeWindMultiplier * pressureMultiplier,
    rainLast3DaysMm: Math.round(rainLast3DaysMm * 10) / 10,
    windyHoursLast48,
    avgPressureHpa,
  };
}
