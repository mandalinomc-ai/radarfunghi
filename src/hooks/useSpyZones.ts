"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpyZoneMarker } from "@/lib/types";

export function useSpyZones() {
  const [zones, setZones] = useState<SpyZoneMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/spy-zones", { cache: "no-store" });
      if (!res.ok) throw new Error("Caricamento zone spia fallito");
      const data = await res.json();
      setZones((data.zones ?? []) as SpyZoneMarker[]);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 90_000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { zones, loading, error, refresh };
}
