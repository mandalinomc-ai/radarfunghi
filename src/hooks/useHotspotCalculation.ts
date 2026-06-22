import { useMemo } from "react";
import type { FungalZone } from "@/lib/types";
import { buildHotspots } from "@/lib/predictionEngine";
import {
  matchesProbabilityFilter,
  type ProbabilityFilter,
} from "@/lib/mapUtils";
import type { HourRange } from "@/lib/timeRange";
import type { MushroomSpecies } from "@/lib/types";
import { filterZonesByRegions } from "@/lib/zoneFilters";
import { distanceFromPoint } from "@/lib/geoUtils";
import type { GeoPoint } from "@/lib/geoUtils";
import type { HotspotSortMode } from "@/lib/foragingPresets";

export interface HotspotCalculationInput {
  liveZones: FungalZone[];
  origin: GeoPoint & { name: string };
  includedRegions: FungalZone["region"][];
  rangeKm: number;
  species: MushroomSpecies | "all";
  hourRange: HourRange;
  selectedDate: string;
  probabilityFilter: ProbabilityFilter;
  minAltitude?: number;
  maxAltitude?: number;
  sortMode?: HotspotSortMode;
}

function enrichZonesFromOrigin(
  zones: FungalZone[],
  origin: GeoPoint & { name: string }
): FungalZone[] {
  return zones.map((zone) => {
    const dist = distanceFromPoint(
      origin,
      zone.parkingLat,
      zone.parkingLng
    );
    return {
      ...zone,
      kmFromBenevento: dist.roadKm,
      driveMinutesFromBenevento: dist.driveMinutes,
    };
  });
}

function sortHotspots<T extends { activeScore: number; zone: FungalZone }>(
  items: T[],
  mode: HotspotSortMode
): T[] {
  const copy = [...items];
  if (mode === "distance") {
    copy.sort(
      (a, b) => a.zone.kmFromBenevento - b.zone.kmFromBenevento ||
        b.activeScore - a.activeScore
    );
  } else {
    copy.sort(
      (a, b) => b.activeScore - a.activeScore ||
        a.zone.kmFromBenevento - b.zone.kmFromBenevento
    );
  }
  return copy;
}

/** Pipeline Sprout Score — Specifica Master §5 */
export function useHotspotCalculation(input: HotspotCalculationInput) {
  const minAlt = input.minAltitude ?? 400;
  const maxAlt = input.maxAltitude ?? 1800;
  const sortMode = input.sortMode ?? "score";

  const zonesWithOrigin = useMemo(
    () => enrichZonesFromOrigin(input.liveZones, input.origin),
    [input.liveZones, input.origin]
  );

  const zonesByRegion = useMemo(
    () => filterZonesByRegions(zonesWithOrigin, input.includedRegions),
    [zonesWithOrigin, input.includedRegions]
  );

  const zonesInRange = useMemo(
    () =>
      zonesByRegion.filter(
        (z) =>
          z.kmFromBenevento <= input.rangeKm &&
          z.altitude >= minAlt &&
          z.altitude <= maxAlt
      ),
    [zonesByRegion, input.rangeKm, minAlt, maxAlt]
  );

  const hotspots = useMemo(() => {
    const built = buildHotspots(
      zonesInRange,
      input.species,
      input.hourRange,
      input.selectedDate
    );
    return sortHotspots(built, sortMode);
  }, [
    zonesInRange,
    input.species,
    input.hourRange,
    input.selectedDate,
    sortMode,
  ]);

  const filteredHotspots = useMemo(() => {
    const filtered = hotspots.filter((h) =>
      matchesProbabilityFilter(h.activeScore, input.probabilityFilter)
    );
    return sortHotspots(filtered, sortMode);
  }, [hotspots, input.probabilityFilter, sortMode]);

  const bestHotspot = useMemo(
    () => filteredHotspots[0] ?? null,
    [filteredHotspots]
  );

  const avgScore = useMemo(() => {
    if (filteredHotspots.length === 0) return 0;
    const sum = filteredHotspots.reduce((acc, h) => acc + h.activeScore, 0);
    return Math.round(sum / filteredHotspots.length);
  }, [filteredHotspots]);

  const activeHotspots = useMemo(
    () => filteredHotspots.filter((h) => h.activeScore >= 40).length,
    [filteredHotspots]
  );

  return {
    zonesWithOrigin,
    zonesByRegion,
    zonesInRange,
    hotspots,
    filteredHotspots,
    bestHotspot,
    avgScore,
    activeHotspots,
  };
}

export type HotspotCalculationResult = ReturnType<typeof useHotspotCalculation>;
