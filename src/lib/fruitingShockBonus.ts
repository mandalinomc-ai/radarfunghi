import type { FungalZone } from "./types";

const TEMP_DROP_C = 6;
const LOOKBACK_HOURS = 72;
const MIN_RAIN_MM = 8;

/** Fruiting Shock: calo ≥6°C in 72h dopo pioggia → bonus porcino +15% */
export function calculateFruitingShockBonus(
  zone: FungalZone,
  selectedDate: string
): number {
  const recentRain = zone.rainHistory
    .filter((d) => d.date <= selectedDate)
    .slice(-5)
    .reduce((s, d) => s + d.mm, 0);

  if (recentRain < MIN_RAIN_MM) return 1;

  const forecasts = zone.hourlyForecasts;
  if (forecasts.length < 8) return 1;

  const recentTemps = forecasts.slice(-LOOKBACK_HOURS).map((f) => f.temperature);
  if (recentTemps.length < 4) return 1;

  const maxTemp = Math.max(...recentTemps);
  const latestTemp = recentTemps[recentTemps.length - 1];
  const drop = maxTemp - latestTemp;

  if (drop >= TEMP_DROP_C) return 1.15;
  return 1;
}
