import { FUNGAL_ZONE_COORDS } from "@/lib/zoneRegistry";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { WEATHER_FORECAST_DAYS, WEATHER_PAST_DAYS } from "@/lib/constants";
import { getRegionalAgrometeo } from "@/lib/regionalAgrometeo";
import type { FungalZone, HourlyForecast } from "@/lib/types";
import { formatDateISO } from "@/lib/dateUtils";

export interface OpenMeteoBundle {
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    soil_moisture_0_to_7cm: number[];
    precipitation: number[];
    wind_speed_10m?: number[];
  };
  daily: {
    time: string[];
    precipitation_sum: number[];
  };
}

export interface ZoneWeatherPayload {
  zoneId: string;
  region: FungalZone["region"];
  rainHistory: FungalZone["rainHistory"];
  hourlyForecasts: HourlyForecast[];
  forecastsByDate: Record<string, HourlyForecast[]>;
  nightThermalShock: number;
  baseSoilMoisture: number;
}

export interface AggregatedWeatherSnapshot {
  today: string;
  targetDate: string;
  fetchedAt: string;
  sources: string[];
  zones: ZoneWeatherPayload[];
  zoneCount: number;
  clusterCount: number;
}

function clusterKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)},${lng.toFixed(2)}`;
}

export async function fetchOpenMeteoBundle(
  lat: number,
  lng: number,
  elevation?: number
): Promise<OpenMeteoBundle> {
  const base = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "Europe/Rome",
    past_days: String(WEATHER_PAST_DAYS),
    forecast_days: String(WEATHER_FORECAST_DAYS),
  });

  if (elevation != null && elevation > 0) {
    base.set("elevation", String(Math.round(elevation)));
  }

  const hourlyUrl = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    ...Object.fromEntries(base),
    hourly:
      "temperature_2m,relative_humidity_2m,soil_moisture_0_to_7cm,precipitation,wind_speed_10m",
    models: "best_match",
  })}`;

  const dailyUrl = `https://api.open-meteo.com/v1/forecast?${new URLSearchParams({
    ...Object.fromEntries(base),
    daily: "precipitation_sum",
  })}`;

  const [hourlyRes, dailyRes] = await Promise.all([
    fetch(hourlyUrl, { cache: "no-store" }),
    fetch(dailyUrl, { cache: "no-store" }),
  ]);

  if (!hourlyRes.ok || !dailyRes.ok) {
    throw new Error("Open-Meteo request failed");
  }

  const hourlyJson = await hourlyRes.json();
  const dailyJson = await dailyRes.json();

  return {
    hourly: hourlyJson.hourly,
    daily: dailyJson.daily,
  };
}

function computeThermalShock(hourly: HourlyForecast[]): number {
  const temps = hourly.map((f) => f.temperature);
  const nightTemps = temps.slice(0, 6).concat(temps.slice(20));
  const dayTemps = temps.slice(8, 18);
  if (nightTemps.length === 0 || dayTemps.length === 0) return 8;
  return Math.max(
    4,
    Math.round((Math.max(...dayTemps) - Math.min(...nightTemps)) * 10) / 10
  );
}

function buildHourlyForDate(
  data: OpenMeteoBundle,
  targetDate: string,
  altitude: number,
  region: FungalZone["region"]
): HourlyForecast[] {
  const altFactor = Math.min(1.15, 1 + (altitude - 800) * 0.00008);
  const agro = getRegionalAgrometeo(region);

  const dayHours = data.hourly.time
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.startsWith(targetDate));

  const fallback =
    dayHours.length > 0
      ? dayHours
      : data.hourly.time.map((t, i) => ({ t, i }));

  return Array.from({ length: 24 }, (_, hour) => {
    const match = fallback.find(({ t }) => Number(t.slice(11, 13)) === hour);
    const idx = match?.i ?? fallback[Math.min(hour, fallback.length - 1)]?.i ?? 0;
    const soilRaw = data.hourly.soil_moisture_0_to_7cm[idx] ?? 0.35;
    return {
      hour,
      temperature:
        Math.round((data.hourly.temperature_2m[idx] ?? 14) * altFactor * 10) /
        10,
      humidity: Math.min(
        100,
        Math.round(
          (data.hourly.relative_humidity_2m[idx] ?? 70) + agro.humidityBias
        )
      ),
      soilMoisture: Math.min(
        100,
        Math.round(
          (soilRaw * 100 * altFactor + agro.soilMoistureBias) * 10
        ) / 10
      ),
      windSpeed: Math.round(data.hourly.wind_speed_10m?.[idx] ?? 8),
    };
  });
}

function buildForecastsByDate(
  data: OpenMeteoBundle,
  altitude: number,
  region: FungalZone["region"]
): Record<string, HourlyForecast[]> {
  const dates = new Set<string>();
  for (const t of data.hourly.time) {
    dates.add(t.slice(0, 10));
  }
  const out: Record<string, HourlyForecast[]> = {};
  for (const date of dates) {
    out[date] = buildHourlyForDate(data, date, altitude, region);
  }
  return out;
}

function buildRainHistory(
  data: OpenMeteoBundle,
  region: FungalZone["region"],
  untilDate?: string
): FungalZone["rainHistory"] {
  const agro = getRegionalAgrometeo(region);
  return data.daily.time
    .filter((date) => !untilDate || date <= untilDate)
    .map((date, i) => ({
      date,
      mm:
        Math.round(
          (data.daily.precipitation_sum[i] ?? 0) *
            agro.rainBias *
            10
        ) / 10,
    }));
}

export function buildZoneWeatherFromBundle(
  zoneId: string,
  region: FungalZone["region"],
  altitude: number,
  data: OpenMeteoBundle,
  targetDate: string
): ZoneWeatherPayload {
  const forecastsByDate = buildForecastsByDate(data, altitude, region);
  const hourlyForecasts =
    forecastsByDate[targetDate] ??
    buildHourlyForDate(data, targetDate, altitude, region);
  const rainHistory = buildRainHistory(data, region, targetDate);
  const avgSoil =
    hourlyForecasts.reduce((s, f) => s + f.soilMoisture, 0) /
    hourlyForecasts.length;

  return {
    zoneId,
    region,
    rainHistory,
    hourlyForecasts,
    forecastsByDate,
    nightThermalShock: computeThermalShock(hourlyForecasts),
    baseSoilMoisture: Math.round(avgSoil * 10) / 10,
  };
}

export async function aggregateAllZoneWeather(
  targetDate: string
): Promise<AggregatedWeatherSnapshot> {
  const today = formatDateISO(new Date());
  const clusters = new Map<
    string,
    {
      lat: number;
      lng: number;
      zones: Array<(typeof FUNGAL_ZONE_COORDS)[number] & { region: FungalZone["region"] }>;
    }
  >();

  const regionById = new Map(FUNGAL_ZONES.map((z) => [z.id, z.region]));

  for (const z of FUNGAL_ZONE_COORDS) {
    const region = regionById.get(z.id) ?? "sannio";
    const key = clusterKey(z.lat, z.lng);
    const existing = clusters.get(key);
    const zoneWithRegion = { ...z, region };
    if (existing) {
      existing.zones.push(zoneWithRegion);
    } else {
      clusters.set(key, { lat: z.lat, lng: z.lng, zones: [zoneWithRegion] });
    }
  }

  const clusterList = [...clusters.values()];
  const bundleByCluster = new Map<string, OpenMeteoBundle>();
  const BATCH = 4;

  for (let i = 0; i < clusterList.length; i += BATCH) {
    const batch = clusterList.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map(async (cluster) => {
        const medianAlt =
          cluster.zones.reduce((s, z) => s + z.altitude, 0) /
          cluster.zones.length;
        const data = await fetchOpenMeteoBundle(
          cluster.lat,
          cluster.lng,
          medianAlt
        );
        return { key: clusterKey(cluster.lat, cluster.lng), data };
      })
    );
    for (const r of results) {
      if (r.status === "fulfilled") {
        bundleByCluster.set(r.value.key, r.value.data);
      }
    }
  }

  if (bundleByCluster.size === 0) {
    throw new Error("Nessun dato meteo ricevuto dalle fonti ufficiali");
  }

  const zones: ZoneWeatherPayload[] = [];
  for (const cluster of clusterList) {
    const key = clusterKey(cluster.lat, cluster.lng);
    const bundle = bundleByCluster.get(key);
    if (!bundle) continue;
    for (const zone of cluster.zones) {
      zones.push(
        buildZoneWeatherFromBundle(
          zone.id,
          zone.region,
          zone.altitude,
          bundle,
          targetDate
        )
      );
    }
  }

  return {
    today,
    targetDate,
    fetchedAt: new Date().toISOString(),
    sources: [
      "Open-Meteo (ECMWF/GFS best_match)",
      "ARPA Campania",
      "ARPA Molise",
      "ARPA Basilicata",
      "Funghimagazine (editoriale)",
    ],
    zones,
    zoneCount: zones.length,
    clusterCount: bundleByCluster.size,
  };
}
