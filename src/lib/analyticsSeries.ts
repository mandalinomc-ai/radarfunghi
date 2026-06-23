import type { FungalZone, MushroomSpecies } from "./types";
import { calculateSproutScore } from "./predictionEngine";
import { getHoursInRange, type HourRange } from "./timeRange";

export interface AnalyticsSeriesPoint {
  label: string;
  value: number;
}

export interface AnalyticsDataset {
  id: string;
  label: string;
  color: string;
  points: AnalyticsSeriesPoint[];
}

const SPECIES_COLORS: Record<MushroomSpecies, string> = {
  porcino: "#00ff66",
  estatino: "#f59a4a",
  galletto: "#7ab872",
};

const REGION_COLORS: Record<FungalZone["region"], string> = {
  matese: "#14b8a6",
  taburno: "#f59e0b",
  sannio: "#22c55e",
  molise: "#3b82f6",
  campania: "#e07830",
  basilicata: "#a78bfa",
};

function dateForYearMonthDay(year: number, month: number, day: number): string {
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toISOString().slice(0, 10);
}

function scoreForZoneDate(
  zone: FungalZone,
  species: MushroomSpecies,
  date: string,
  hourRange: HourRange
): number {
  const hours = getHoursInRange(hourRange);
  const preds = hours.map((h) => calculateSproutScore(zone, species, h, date));
  return preds.reduce((best, p) => (p.score > best ? p.score : best), 0);
}

export function buildSpeciesComparisonSeries(
  zones: FungalZone[],
  speciesList: MushroomSpecies[],
  years: number[],
  monthStart: number,
  dayStart: number,
  monthEnd: number,
  dayEnd: number,
  hourRange: HourRange
): AnalyticsDataset[] {
  const representative = zones[0];
  if (!representative) return [];

  const datasets: AnalyticsDataset[] = [];

  for (const species of speciesList) {
    for (const year of years) {
      const points: AnalyticsSeriesPoint[] = [];
      let m = monthStart;
      let d = dayStart;
      const endKey = monthEnd * 100 + dayEnd;

      for (let guard = 0; guard < 366; guard++) {
        const key = m * 100 + d;
        if (key > endKey) break;
        const iso = dateForYearMonthDay(year, m, d);
        const avg =
          zones.reduce(
            (s, z) => s + scoreForZoneDate(z, species, iso, hourRange),
            0
          ) / zones.length;
        points.push({
          label: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
          value: Math.round(avg),
        });
        d++;
        const daysInMonth = new Date(year, m, 0).getDate();
        if (d > daysInMonth) {
          d = 1;
          m++;
        }
      }

      datasets.push({
        id: `${species}-${year}`,
        label: `${species} ${year}`,
        color: SPECIES_COLORS[species],
        points,
      });
    }
  }

  return datasets;
}

export function buildRegionComparisonSeries(
  zones: FungalZone[],
  regions: FungalZone["region"][],
  species: MushroomSpecies,
  years: number[],
  monthStart: number,
  dayStart: number,
  monthEnd: number,
  dayEnd: number,
  hourRange: HourRange
): AnalyticsDataset[] {
  const datasets: AnalyticsDataset[] = [];

  for (const region of regions) {
    const regionZones = zones.filter((z) => z.region === region);
    if (regionZones.length === 0) continue;

    for (const year of years) {
      const points: AnalyticsSeriesPoint[] = [];
      let m = monthStart;
      let d = dayStart;
      const endKey = monthEnd * 100 + dayEnd;

      for (let guard = 0; guard < 366; guard++) {
        const key = m * 100 + d;
        if (key > endKey) break;
        const iso = dateForYearMonthDay(year, m, d);
        const avg =
          regionZones.reduce(
            (s, z) => s + scoreForZoneDate(z, species, iso, hourRange),
            0
          ) / regionZones.length;
        points.push({
          label: `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`,
          value: Math.round(avg),
        });
        d++;
        const daysInMonth = new Date(year, m, 0).getDate();
        if (d > daysInMonth) {
          d = 1;
          m++;
        }
      }

      datasets.push({
        id: `${region}-${year}`,
        label: `${region} ${year}`,
        color: REGION_COLORS[region],
        points,
      });
    }
  }

  return datasets;
}

export function datasetsToChartJs(datasets: AnalyticsDataset[]) {
  const labels = datasets[0]?.points.map((p) => p.label) ?? [];
  return {
    labels,
    datasets: datasets.map((ds, i) => ({
      label: ds.label,
      data: ds.points.map((p) => p.value),
      borderColor: ds.color,
      backgroundColor: `${ds.color}33`,
      tension: 0.35,
      borderWidth: 2,
      pointRadius: 2,
    })),
  };
}
