"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MapHotspot } from "@/lib/types";
import type { ProbabilityFilter } from "@/lib/mapUtils";
import {
  createDefaultSearchCriteria,
  type SearchCriteria,
} from "@/components/AdvancedSearchDrawer";
import { DEFAULT_SEARCH_RADIUS_KM } from "@/lib/benevento";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { loadStoredOrigin } from "@/lib/originStore";
import { useLiveZones } from "@/hooks/useLiveZones";
import { useHotspotCalculation } from "@/hooks/useHotspotCalculation";

export type AltitudeBand = "all" | "500-900" | "900-1300" | "1300+";

export const ALTITUDE_BANDS: {
  id: AltitudeBand;
  label: string;
  min: number;
  max: number;
}[] = [
  { id: "all", label: "Tutte le quote", min: 400, max: 1800 },
  { id: "500-900", label: "500–900 m", min: 500, max: 900 },
  { id: "900-1300", label: "900–1300 m", min: 900, max: 1300 },
  { id: "1300+", label: "1300 m+", min: 1300, max: 1800 },
];

interface RadarSearchContextValue {
  criteria: SearchCriteria;
  setCriteria: (c: SearchCriteria | ((prev: SearchCriteria) => SearchCriteria)) => void;
  rangeKm: number;
  setRangeKm: (km: number) => void;
  probabilityFilter: ProbabilityFilter;
  setProbabilityFilter: (f: ProbabilityFilter) => void;
  altitudeBand: AltitudeBand;
  setAltitudeBand: (b: AltitudeBand) => void;
  selectedHotspot: MapHotspot | null;
  setSelectedHotspot: (h: MapHotspot | null) => void;
  filteredHotspots: MapHotspot[];
  liveZones: import("@/lib/types").FungalZone[];
  bestHotspot: MapHotspot | null;
  avgScore: number;
  activeHotspots: number;
  loading: boolean;
  lastUpdated: string | null;
  liveData: boolean;
  refresh: () => void;
}

const RadarSearchContext = createContext<RadarSearchContextValue | null>(null);

export function RadarSearchProvider({ children }: { children: ReactNode }) {
  const [criteria, setCriteria] = useState<SearchCriteria>(() => {
    const base = createDefaultSearchCriteria();
    if (typeof window === "undefined") return base;
    const saved = loadStoredOrigin();
    return saved ? { ...base, origin: saved } : base;
  });

  const [rangeKm, setRangeKm] = useState(DEFAULT_SEARCH_RADIUS_KM);
  const [probabilityFilter, setProbabilityFilter] =
    useState<ProbabilityFilter>("all");
  const [altitudeBand, setAltitudeBand] = useState<AltitudeBand>("all");
  const [selectedHotspot, setSelectedHotspot] = useState<MapHotspot | null>(
    null
  );

  const band = ALTITUDE_BANDS.find((b) => b.id === altitudeBand) ?? ALTITUDE_BANDS[0];

  const { zones: liveZones, loading, lastUpdate, refresh, liveData } =
    useLiveZones(FUNGAL_ZONES, criteria.selectedDate, { pauseRefresh: false });

  const calc = useHotspotCalculation({
    liveZones,
    origin: { ...criteria.origin, name: criteria.origin.name ?? "Partenza" },
    includedRegions: criteria.includedRegions,
    rangeKm,
    species: criteria.species,
    hourRange: criteria.hourRange,
    selectedDate: criteria.selectedDate,
    probabilityFilter,
    minAltitude: band.min,
    maxAltitude: band.max,
    sortMode: criteria.sortMode,
  });

  const value = useMemo(
    () => ({
      criteria,
      setCriteria,
      rangeKm,
      setRangeKm,
      probabilityFilter,
      setProbabilityFilter,
      altitudeBand,
      setAltitudeBand,
      selectedHotspot,
      setSelectedHotspot,
      filteredHotspots: calc.filteredHotspots,
      liveZones,
      bestHotspot: calc.bestHotspot,
      avgScore: calc.avgScore,
      activeHotspots: calc.activeHotspots,
      loading,
      lastUpdated: lastUpdate,
      liveData,
      refresh,
    }),
    [
      criteria,
      rangeKm,
      probabilityFilter,
      altitudeBand,
      selectedHotspot,
      calc,
      liveZones,
      loading,
      lastUpdate,
      liveData,
      refresh,
    ]
  );

  return (
    <RadarSearchContext.Provider value={value}>
      {children}
    </RadarSearchContext.Provider>
  );
}

export function useRadarSearch(): RadarSearchContextValue {
  const ctx = useContext(RadarSearchContext);
  if (!ctx) {
    throw new Error("useRadarSearch requires RadarSearchProvider");
  }
  return ctx;
}
