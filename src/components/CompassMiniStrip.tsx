"use client";

import type { GeoPoint } from "@/lib/geoUtils";
import { buildNavigationSummary, bearingToCardinal } from "@/lib/bearingUtils";

interface CompassMiniStripProps {
  origin: GeoPoint;
  targetLat: number;
  targetLng: number;
  targetLabel: string;
  onOpenGuide: (tab?: "compass" | "territory") => void;
  compact?: boolean;
}

export default function CompassMiniStrip({
  origin,
  targetLat,
  targetLng,
  targetLabel,
  onOpenGuide,
  compact,
}: CompassMiniStripProps) {
  const nav = buildNavigationSummary(origin, targetLat, targetLng);

  return (
    <div
      className={`rounded-xl border border-amber-500/30 bg-amber-950/20 ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[10px] uppercase tracking-wider text-amber-300/90 font-medium">
          🧭 Orientamento
        </p>
        <span className="text-[10px] text-forest-500">{nav.distanceKm} km</span>
      </div>
      <p className="text-xs text-forest-200 mb-1">
        Verso <strong className="text-amber-200">{targetLabel}</strong>:{" "}
        <span className="text-amber-300">
          {bearingToCardinal(nav.bearingDeg)} ({nav.bearingDeg}°)
        </span>
      </p>
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => onOpenGuide("compass")}
          className="flex-1 py-2.5 rounded-lg bg-amber-600/25 hover:bg-amber-600/40 border border-amber-500/35 text-amber-100 text-xs font-semibold touch-manipulation"
        >
          Bussola live
        </button>
        <button
          type="button"
          onClick={() => onOpenGuide("territory")}
          className="flex-1 py-2.5 rounded-lg bg-sky-900/40 hover:bg-sky-800/50 border border-sky-500/30 text-sky-100 text-xs font-semibold touch-manipulation"
        >
          Foto &amp; video
        </button>
      </div>
    </div>
  );
}
