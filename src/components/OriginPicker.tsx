"use client";

import { useCallback, useEffect, useState } from "react";
import type { GeoPoint } from "@/lib/geoUtils";
import { BENEVENTO } from "@/lib/benevento";
import {
  captureGpsOrigin,
  defaultOrigin,
  originModeLabel,
  originAccuracyWarning,
  validateCustomOrigin,
} from "@/lib/originStore";
import { useGeocodeSearch } from "@/hooks/useGeocodeSearch";

interface OriginPickerProps {
  origin: GeoPoint;
  onOriginChange: (origin: GeoPoint) => void;
  onSearch?: () => void;
  /** Compatto per barra mobile in alto */
  compact?: boolean;
  showLabel?: boolean;
}

export default function OriginPicker({
  origin,
  onOriginChange,
  onSearch,
  compact = false,
  showLabel = true,
}: OriginPickerProps) {
  const {
    query,
    suggestions,
    searching,
    handleInput,
    clearSuggestions,
    syncQuery,
  } = useGeocodeSearch(origin.name);

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  useEffect(() => {
    syncQuery(origin.name);
  }, [origin.name, syncQuery]);

  const applyOrigin = useCallback(
    (next: GeoPoint) => {
      onOriginChange(next);
      syncQuery(next.name);
      clearSuggestions();
      onSearch?.();
    },
    [onOriginChange, onSearch, syncQuery, clearSuggestions]
  );

  const selectBenevento = () => {
    setGpsError(null);
    applyOrigin(defaultOrigin());
  };

  const selectGps = async () => {
    setGpsError(null);
    setGpsLoading(true);
    try {
      const gpsOrigin = await captureGpsOrigin();
      applyOrigin(gpsOrigin);
    } catch (e) {
      setGpsError(e instanceof Error ? e.message : "Errore GPS");
    } finally {
      setGpsLoading(false);
    }
  };

  const selectPlace = (place: {
    name: string;
    lat: number;
    lng: number;
    confidence?: "high" | "medium" | "low";
  }) => {
    setGpsError(null);
    const check = validateCustomOrigin(
      place.lat,
      place.lng,
      place.confidence
    );
    if (!check.valid) {
      setGpsError(check.error ?? "Posizione non valida");
      return;
    }
    applyOrigin({
      name: place.name,
      lat: place.lat,
      lng: place.lng,
      source: "custom",
      positionConfidence: place.confidence ?? "medium",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      selectPlace(suggestions[0]);
    }
  };

  const activeMode = origin.source ?? (origin.name === BENEVENTO.name ? "benevento" : "custom");

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-2" : "space-y-2.5"}>
      {showLabel && (
        <div className="flex items-center justify-between gap-2">
          <label className="text-[10px] uppercase tracking-wider text-mushroom-400 font-semibold">
            Da dove parti?
          </label>
          <span className="text-[10px] text-forest-400 truncate">
            {originModeLabel(origin)} · {origin.name.split(",")[0]}
          </span>
        </div>
      )}

      <div className="flex gap-1.5">
        <button
          type="button"
          onClick={selectBenevento}
          className={`flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-medium touch-manipulation border ${
            activeMode === "benevento"
              ? "bg-mushroom-600/40 border-mushroom-500/50 text-mushroom-100"
              : "bg-forest-800 border-forest-700/50 text-forest-300"
          }`}
        >
          🏠 Benevento
        </button>
        <button
          type="button"
          onClick={selectGps}
          disabled={gpsLoading}
          className={`flex-1 min-w-0 px-2 py-2 rounded-lg text-xs font-medium touch-manipulation border ${
            activeMode === "gps"
              ? "bg-green-700/40 border-green-500/50 text-green-100"
              : "bg-forest-800 border-forest-700/50 text-forest-300"
          } disabled:opacity-50`}
        >
          {gpsLoading ? "📡..." : "📍 GPS"}
        </button>
      </div>

      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm pointer-events-none">
          ✏️
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Scrivi città o paese di partenza..."
          className="w-full pl-8 pr-2 py-2 md:py-2.5 rounded-lg bg-forest-950 border border-forest-600/50 text-sm text-forest-100 placeholder:text-forest-500 focus:outline-none focus:border-mushroom-500/60"
          autoComplete="off"
        />
        {searching && (
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-mushroom-400 border-t-transparent rounded-full animate-spin" />
        )}
        {suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 top-full mt-1 z-30 bg-forest-950 border border-forest-600/50 rounded-lg shadow-xl max-h-40 overflow-y-auto">
            {suggestions.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => selectPlace(s)}
                  className="w-full text-left px-3 py-2.5 text-xs text-forest-200 hover:bg-forest-800 active:bg-forest-700 touch-manipulation border-b border-forest-800/50 last:border-0"
                >
                  {s.name}
                  {s.confidence === "high" && (
                    <span className="ml-1 text-green-400">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {gpsError && (
        <p className="text-[10px] text-red-400 leading-snug">{gpsError}</p>
      )}

      {originAccuracyWarning(origin) && !gpsError && (
        <p className="text-[10px] text-yellow-400 leading-snug">
          {originAccuracyWarning(origin)}
        </p>
      )}

      {!compact && (
        <p className="text-[10px] text-forest-500">
          GPS sul campo, città scritta o Benevento — usato per distanze e guida.
        </p>
      )}
    </form>
  );
}
