import type { FungalZone } from "./types";

/** Applica meteo specifico per la data selezionata (passato/oggi/futuro) */
export function getZoneForDate(
  zone: FungalZone,
  selectedDate: string
): FungalZone {
  const forecastsByDate = zone.forecastsByDate;
  if (!forecastsByDate) return zone;

  const hourlyForecasts =
    forecastsByDate[selectedDate] ?? zone.hourlyForecasts;

  const rainHistory = zone.rainHistory.filter((d) => d.date <= selectedDate);

  const temps = hourlyForecasts.map((f) => f.temperature);
  const nightTemps = temps.slice(0, 6).concat(temps.slice(20));
  const dayTemps = temps.slice(8, 18);
  const nightThermalShock =
    nightTemps.length && dayTemps.length
      ? Math.max(
          4,
          Math.round((Math.max(...dayTemps) - Math.min(...nightTemps)) * 10) /
            10
        )
      : zone.nightThermalShock;

  const baseSoilMoisture =
    hourlyForecasts.reduce((s, f) => s + f.soilMoisture, 0) /
    hourlyForecasts.length;

  return {
    ...zone,
    rainHistory,
    hourlyForecasts,
    nightThermalShock,
    baseSoilMoisture: Math.round(baseSoilMoisture * 10) / 10,
  };
}

export function enrichZoneWithLiveWeather(
  zone: FungalZone,
  live: {
    rainHistory: FungalZone["rainHistory"];
    hourlyForecasts: FungalZone["hourlyForecasts"];
    forecastsByDate?: Record<string, FungalZone["hourlyForecasts"]>;
    nightThermalShock: number;
    baseSoilMoisture: number;
  }
): FungalZone {
  return {
    ...zone,
    rainHistory: live.rainHistory,
    hourlyForecasts: live.hourlyForecasts,
    forecastsByDate: live.forecastsByDate,
    nightThermalShock: live.nightThermalShock,
    baseSoilMoisture: live.baseSoilMoisture,
  };
}
