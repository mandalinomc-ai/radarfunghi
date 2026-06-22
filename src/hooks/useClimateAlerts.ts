"use client";

import { useEffect, useRef, useState } from "react";
import type { FungalZone, MapHotspot } from "@/lib/types";
import {
  buildWeatherSnapshot,
  computeClimateChangeAlerts,
  type ClimateChangeAlert,
  type WeatherSnapshot,
} from "@/lib/climateChangeAlerts";

export function useClimateAlerts(
  zones: FungalZone[],
  hotspots: MapHotspot[],
  selectedDate: string,
  lastUpdate: string | null
) {
  const prevSnapshotRef = useRef<WeatherSnapshot | null>(null);
  const [alerts, setAlerts] = useState<ClimateChangeAlert[]>([]);
  const [hasFreshChange, setHasFreshChange] = useState(false);

  useEffect(() => {
    const fetchedAt = lastUpdate ?? new Date().toISOString();
    const next = computeClimateChangeAlerts(
      zones,
      hotspots,
      selectedDate,
      fetchedAt,
      prevSnapshotRef.current
    );
    setAlerts(next);
    setHasFreshChange(next.some((a) => a.isChange));
    prevSnapshotRef.current = buildWeatherSnapshot(
      zones,
      selectedDate,
      fetchedAt
    );
  }, [zones, hotspots, selectedDate, lastUpdate]);

  useEffect(() => {
    if (!hasFreshChange) return;
    const t = setTimeout(() => setHasFreshChange(false), 12000);
    return () => clearTimeout(t);
  }, [hasFreshChange, alerts]);

  return { alerts, hasFreshChange };
}
