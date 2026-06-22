import type { HourRange } from "./timeRange";
import type { MushroomSpecies } from "./types";
import type { ProbabilityFilter } from "./mapUtils";

export interface ForagingPreset {
  id: string;
  label: string;
  icon: string;
  hourRange?: HourRange;
  species?: MushroomSpecies | "all";
  probabilityFilter?: ProbabilityFilter;
  minAltitude?: number;
  maxAltitude?: number;
}

export const FORAGING_PRESETS: ForagingPreset[] = [
  {
    id: "morning",
    label: "Mattino",
    icon: "🌅",
    hourRange: { startHour: 5, endHour: 10 },
  },
  {
    id: "porcini",
    label: "Porcini",
    icon: "🍄",
    species: "porcino",
    minAltitude: 900,
    maxAltitude: 1700,
  },
  {
    id: "estatini",
    label: "Estatini",
    icon: "☀️",
    species: "estatino",
    minAltitude: 500,
    maxAltitude: 1000,
  },
  {
    id: "galletti",
    label: "Galletti",
    icon: "🟡",
    species: "galletto",
    minAltitude: 650,
    maxAltitude: 1200,
  },
  {
    id: "high-prob",
    label: "Alta prob.",
    icon: "🔥",
    probabilityFilter: "alta",
  },
];

export type HotspotSortMode = "score" | "distance";
