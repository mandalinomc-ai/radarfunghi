"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FungalZone } from "@/lib/types";
import type { SourceStatus } from "@/lib/dataSources";
import { enrichZoneWithLiveWeather } from "@/lib/zoneWeather";
import { CLIENT_AUTO_REFRESH_MS } from "@/lib/constants";
import { todayISO } from "@/lib/dateUtils";
import { setZoneReliabilityFromSync } from "@/lib/zoneReliabilityBonus";
import type { ZoneReliabilityRecord } from "@/lib/zoneReliabilityStore";

interface SyncWeatherZone {
  zoneId: string;
  rainHistory: FungalZone["rainHistory"];
  hourlyForecasts: FungalZone["hourlyForecasts"];
  forecastsByDate?: Record<string, FungalZone["hourlyForecasts"]>;
  nightThermalShock: number;
  baseSoilMoisture: number;
}

interface SyncResponse {
  fetchedAt: string;
  today: string;
  weather: {
    fetchedAt: string;
    zones: SyncWeatherZone[];
    fromCache?: boolean;
    stale?: boolean;
  } | null;
  weatherError: string | null;
  zoneReliability?: ZoneReliabilityRecord[];
  sources: SourceStatus[];
  autoRefreshMs: number;
  serverCronMinutes: number;
  nextClientRefreshAt: string;
}

export function useLiveZones(baseZones: FungalZone[], selectedDate: string) {
  const [zones, setZones] = useState<FungalZone[]>(baseZones);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const [liveData, setLiveData] = useState(false);
  const [sources, setSources] = useState<SourceStatus[]>([]);
  const [syncMeta, setSyncMeta] = useState<{
    fromCache: boolean;
    stale: boolean;
    serverCronMinutes: number;
  }>({ fromCache: false, stale: false, serverCronMinutes: 10 });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const applySync = useCallback(
    (data: SyncResponse) => {
      const weatherZones = data.weather?.zones ?? [];
      const byId = new Map(weatherZones.map((z) => [z.zoneId, z]));
      let applied = 0;

      const merged = baseZones.map((zone) => {
        const live = byId.get(zone.id);
        if (!live) return zone;
        applied++;
        return enrichZoneWithLiveWeather(zone, live);
      });

      setZones(merged);
      setLiveData(applied > 0);
      setLastUpdate(data.fetchedAt ?? data.weather?.fetchedAt ?? null);
      setSources(data.sources ?? []);
      setSyncMeta({
        fromCache: Boolean(data.weather?.fromCache),
        stale: Boolean(data.weather?.stale),
        serverCronMinutes: data.serverCronMinutes ?? 10,
      });
      if (data.zoneReliability?.length) {
        setZoneReliabilityFromSync(data.zoneReliability);
      }
      setError(
        data.weatherError && applied === 0
          ? data.weatherError
          : data.weatherError
            ? `${data.weatherError} (dati in cache)`
            : null
      );
    },
    [baseZones]
  );

  const refresh = useCallback(
    async (force = false) => {
      setLoading(true);
      try {
        const ts = force ? `&force=1&_t=${Date.now()}` : `&_t=${Date.now()}`;
        const res = await fetch(
          `/api/sync?date=${selectedDate}${ts}`,
          { cache: "no-store" }
        );

        if (!res.ok) {
          throw new Error("Sincronizzazione dati fallita");
        }

        const data = (await res.json()) as SyncResponse;
        applySync(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore aggiornamento");
        setLiveData(false);
        setZones(baseZones);
      } finally {
        setLoading(false);
      }
    },
    [selectedDate, baseZones, applySync]
  );

  useEffect(() => {
    refresh(false);
  }, [refresh]);

  useEffect(() => {
    intervalRef.current = setInterval(
      () => refresh(true),
      CLIENT_AUTO_REFRESH_MS
    );
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        refresh(true);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return {
    zones,
    loading,
    error,
    lastUpdate,
    liveData,
    sources,
    syncMeta,
    todayISO: todayISO(),
    refresh: () => refresh(true),
  };
}
