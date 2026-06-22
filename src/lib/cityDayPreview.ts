import type { FungalZone, MapHotspot, MushroomSpecies } from "./types";
import type { HourRange } from "./timeRange";
import { buildHotspots, getSpeciesLabel } from "./predictionEngine";
import { formatDateLabel, todayISO, addDaysISO } from "./dateUtils";
import { getProbabilityLevel, type ProbabilityLevel } from "./mapUtils";

const ALL_SPECIES: MushroomSpecies[] = ["porcino", "estatino", "galletto"];

export interface SpeciesDayScore {
  species: MushroomSpecies;
  label: string;
  score: number;
  level: ProbabilityLevel;
  zoneName: string;
  km: number;
}

export interface DayPreview {
  date: string;
  dateLabel: string;
  best: MapHotspot | null;
  speciesScores: SpeciesDayScore[];
  activeCount: number;
  verdict: string;
}

export interface CityDualPreview {
  originName: string;
  today: DayPreview;
  tomorrow: DayPreview;
  emerging: Array<{ species: MushroomSpecies; label: string; delta: number }>;
  improving: boolean;
}

function speciesScoresForDay(
  hotspots: MapHotspot[],
  speciesFilter: MushroomSpecies | "all"
): SpeciesDayScore[] {
  const speciesList =
    speciesFilter === "all" ? ALL_SPECIES : [speciesFilter];

  return speciesList.map((species) => {
    let bestScore = 0;
    let bestZone: MapHotspot | null = null;

    for (const h of hotspots) {
      const pred = h.predictions.find((p) => p.species === species);
      if (pred && pred.score > bestScore) {
        bestScore = pred.score;
        bestZone = h;
      }
    }

    return {
      species,
      label: getSpeciesLabel(species),
      score: bestScore,
      level: getProbabilityLevel(bestScore),
      zoneName: bestZone?.zone.name ?? "—",
      km: bestZone?.zone.kmFromBenevento ?? 0,
    };
  });
}

function buildVerdict(preview: DayPreview): string {
  const best = preview.best;
  if (!best || best.activeScore < 28) {
    return "Potenziale basso nel raggio — prova ad ampliare km o cambiare fascia oraria.";
  }

  const top = preview.speciesScores
    .filter((s) => s.score >= 40)
    .sort((a, b) => b.score - a.score);

  if (top.length === 0) {
    return `${best.zone.name} (${best.activeScore}%): condizioni deboli, meglio attendere piogge.`;
  }

  const names = top.map((s) => `${s.label} ${s.score}%`).join(" · ");
  return `${best.zone.name} · ${names}`;
}

export function buildDayPreview(
  zones: FungalZone[],
  species: MushroomSpecies | "all",
  hourRange: HourRange,
  date: string
): DayPreview {
  const hotspots = buildHotspots(zones, species, hourRange, date);
  const sorted = [...hotspots].sort((a, b) => b.activeScore - a.activeScore);
  const best = sorted[0] ?? null;
  const speciesScores = speciesScoresForDay(hotspots, species);
  const activeCount = hotspots.filter((h) => h.activeScore >= 40).length;

  const preview: DayPreview = {
    date,
    dateLabel: formatDateLabel(date),
    best,
    speciesScores,
    activeCount,
    verdict: "",
  };
  preview.verdict = buildVerdict(preview);
  return preview;
}

export function buildCityDualPreview(
  zones: FungalZone[],
  originName: string,
  species: MushroomSpecies | "all",
  hourRange: HourRange
): CityDualPreview {
  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  const todayPreview = buildDayPreview(zones, species, hourRange, today);
  const tomorrowPreview = buildDayPreview(zones, species, hourRange, tomorrow);

  const emerging: CityDualPreview["emerging"] = [];
  for (const t of tomorrowPreview.speciesScores) {
    const now = todayPreview.speciesScores.find((s) => s.species === t.species);
    const delta = t.score - (now?.score ?? 0);
    if (delta >= 8 || (now?.score ?? 0) < 40 && t.score >= 40) {
      emerging.push({
        species: t.species,
        label: t.label,
        delta,
      });
    }
  }
  emerging.sort((a, b) => b.delta - a.delta);

  const bestDelta =
    (tomorrowPreview.best?.activeScore ?? 0) -
    (todayPreview.best?.activeScore ?? 0);

  return {
    originName,
    today: todayPreview,
    tomorrow: tomorrowPreview,
    emerging,
    improving: bestDelta > 5 || emerging.length > 0,
  };
}
