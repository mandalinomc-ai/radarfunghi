"use client";

import { useCallback, useEffect, useState } from "react";
import type { MushroomReport } from "@/lib/types";
import {
  pendingReportCount,
  syncPendingReports,
} from "@/lib/reportOfflineStore";

export function useMushroomReports() {
  const [reports, setReports] = useState<MushroomReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const syncResult = await syncPendingReports();
      const res = await fetch("/api/reports", { cache: "no-store" });
      if (!res.ok) throw new Error("Caricamento segnalazioni fallito");
      const data = await res.json();
      const serverReports = (data.reports ?? []) as MushroomReport[];
      setReports((prev) => {
        const ids = new Set(serverReports.map((r) => r.id));
        const merged = [...serverReports];
        for (const s of syncResult.synced) {
          if (!ids.has(s.id)) merged.unshift(s);
        }
        return merged;
      });
      const pending = await pendingReportCount();
      setPendingCount(pending);

      if (syncResult.failedCount > 0 && syncResult.lastError) {
        setSyncError(
          `${syncResult.failedCount} segnalazione/i offline non sincronizzata/e. ${syncResult.lastError} Riprova con rete stabile.`
        );
      } else {
        setSyncError(null);
      }
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore");
      setPendingCount(await pendingReportCount());
    } finally {
      setLoading(false);
    }
  }, []);

  const dismissSyncError = useCallback(() => setSyncError(null), []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60_000);
    const onOnline = () => refresh();
    window.addEventListener("online", onOnline);
    return () => {
      clearInterval(interval);
      window.removeEventListener("online", onOnline);
    };
  }, [refresh]);

  return {
    reports,
    loading,
    error,
    refresh,
    pendingCount,
    syncError,
    dismissSyncError,
  };
}
