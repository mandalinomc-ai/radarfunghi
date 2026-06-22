import { formatDateISO } from "./dateUtils";

export type HistoryMonths = 1 | 3 | 6 | 12;

export interface DailyWeatherHistoryPoint {
  date: string;
  precipitationMm: number;
  humidityPct: number;
  windGustsKmh: number;
}

export interface DailyWeatherHistory {
  points: DailyWeatherHistoryPoint[];
  startDate: string;
  endDate: string;
  fetchedAt: string;
  lat: number;
  lng: number;
  months: HistoryMonths;
  source: string;
}

const DEFAULT_LAT = 42.5;
const DEFAULT_LNG = 12.5;

export function defaultHistoryCoords(): { lat: number; lng: number } {
  return { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
}

function subtractMonths(from: Date, months: number): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() - months);
  return d;
}

function daysBetween(start: string, end: string): number {
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  return Math.ceil((b.getTime() - a.getTime()) / 86400000);
}

const DAILY_VARS =
  "precipitation_sum,relative_humidity_2m_mean,wind_gusts_10m_max";

interface OpenMeteoDailyJson {
  daily?: {
    time: string[];
    precipitation_sum?: (number | null)[];
    relative_humidity_2m_mean?: (number | null)[];
    wind_gusts_10m_max?: (number | null)[];
  };
}

function parseDailyJson(json: OpenMeteoDailyJson): DailyWeatherHistoryPoint[] {
  const d = json.daily;
  if (!d?.time?.length) return [];
  return d.time.map((date, i) => ({
    date,
    precipitationMm: Math.round((d.precipitation_sum?.[i] ?? 0) * 10) / 10,
    humidityPct: Math.round(d.relative_humidity_2m_mean?.[i] ?? 0),
    windGustsKmh: Math.round(d.wind_gusts_10m_max?.[i] ?? 0),
  }));
}

async function fetchForecastDaily(
  lat: number,
  lng: number,
  pastDays: number
): Promise<DailyWeatherHistoryPoint[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "Europe/Rome",
    past_days: String(Math.min(92, Math.max(1, pastDays))),
    forecast_days: "1",
    daily: DAILY_VARS,
  });
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Open-Meteo forecast: ${res.status}`);
  return parseDailyJson(await res.json());
}

async function fetchArchiveDaily(
  lat: number,
  lng: number,
  startDate: string,
  endDate: string
): Promise<DailyWeatherHistoryPoint[]> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: "Europe/Rome",
    start_date: startDate,
    end_date: endDate,
    daily: DAILY_VARS,
  });
  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?${params}`,
    { cache: "no-store" }
  );
  if (!res.ok) throw new Error(`Open-Meteo archive: ${res.status}`);
  return parseDailyJson(await res.json());
}

function mergePoints(
  ...series: DailyWeatherHistoryPoint[][]
): DailyWeatherHistoryPoint[] {
  const byDate = new Map<string, DailyWeatherHistoryPoint>();
  for (const list of series) {
    for (const p of list) {
      byDate.set(p.date, p);
    }
  }
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, p]) => p);
}

/**
 * Recupera storico giornaliero LIVE da Open-Meteo (forecast + archive).
 */
export async function fetchOpenMeteoHistory(
  lat: number,
  lng: number,
  months: HistoryMonths
): Promise<DailyWeatherHistory> {
  const end = new Date();
  const endDate = formatDateISO(end);
  const startDate = formatDateISO(subtractMonths(end, months));
  const totalDays = daysBetween(startDate, endDate);

  let points: DailyWeatherHistoryPoint[];

  if (totalDays <= 92) {
    points = await fetchForecastDaily(lat, lng, totalDays);
    points = points.filter((p) => p.date >= startDate && p.date <= endDate);
  } else {
    const archiveEnd = new Date(end);
    archiveEnd.setDate(archiveEnd.getDate() - 3);
    const archiveEndStr = formatDateISO(archiveEnd);

    const recentStart = new Date(archiveEnd);
    recentStart.setDate(recentStart.getDate() - 14);
    const recentStartStr = formatDateISO(recentStart);

    const [archive, recent] = await Promise.all([
      fetchArchiveDaily(lat, lng, startDate, archiveEndStr),
      fetchForecastDaily(lat, lng, 16),
    ]);

    const recentFiltered = recent.filter((p) => p.date >= recentStartStr);
    points = mergePoints(archive, recentFiltered).filter(
      (p) => p.date >= startDate && p.date <= endDate
    );
  }

  if (points.length === 0) {
    throw new Error("Nessun dato meteo storico ricevuto da Open-Meteo");
  }

  return {
    points,
    startDate,
    endDate,
    fetchedAt: new Date().toISOString(),
    lat,
    lng,
    months,
    source: "Open-Meteo (forecast + ERA5 archive)",
  };
}

export function sumRainLastDays(
  history: DailyWeatherHistory,
  days: number
): number {
  const slice = history.points.slice(-days);
  return (
    Math.round(slice.reduce((s, p) => s + p.precipitationMm, 0) * 10) / 10
  );
}

export function avgHumidityLastDays(
  history: DailyWeatherHistory,
  days: number
): number {
  const slice = history.points.slice(-days);
  if (slice.length === 0) return 0;
  return Math.round(
    slice.reduce((s, p) => s + p.humidityPct, 0) / slice.length
  );
}
