"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";
import type { DailyWeatherHistory, HistoryMonths } from "@/lib/openMeteoHistory";
import { defaultHistoryCoords } from "@/lib/openMeteoHistory";

export function useWeatherHistory(
  origin: GeoPoint | null,
  months: HistoryMonths,
  enabled = true
) {
  const [data, setData] = useState<DailyWeatherHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    const lat = origin?.lat ?? defaultHistoryCoords().lat;
    const lng = origin?.lng ?? defaultHistoryCoords().lng;
    try {
      const res = await fetch(
        `/api/weather/history?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}&months=${months}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento meteo");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [origin?.lat, origin?.lng, months, enabled]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refresh: load };
}
