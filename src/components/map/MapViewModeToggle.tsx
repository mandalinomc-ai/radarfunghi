"use client";

import type { MapViewMode } from "./mushroomMapProps";
import { canUseMap3D } from "@/lib/deviceUtils";

interface MapViewModeToggleProps {
  mode: MapViewMode;
  onChange: (mode: MapViewMode) => void;
}

export default function MapViewModeToggle({
  mode,
  onChange,
}: MapViewModeToggleProps) {
  const allow3d = canUseMap3D();

  return (
    <div
      className="absolute top-3 right-3 z-[1001] flex rounded-xl overflow-hidden border border-forest-600/50 bg-forest-950/90 backdrop-blur-md shadow-lg"
      role="group"
      aria-label="Modalità mappa"
    >
      <button
        type="button"
        onClick={() => onChange("2d")}
        className={`px-3 py-2 text-[11px] font-semibold touch-manipulation transition-colors ${
          mode === "2d"
            ? "bg-mushroom-600 text-white"
            : "text-forest-300 hover:bg-forest-800/80"
        }`}
        aria-pressed={mode === "2d"}
      >
        2D
      </button>
      {allow3d ? (
        <button
          type="button"
          onClick={() => onChange("3d")}
          className={`px-3 py-2 text-[11px] font-semibold touch-manipulation transition-colors border-l border-forest-700/50 ${
            mode === "3d"
              ? "bg-mushroom-600 text-white"
              : "text-forest-300 hover:bg-forest-800/80"
          }`}
          aria-pressed={mode === "3d"}
          title="Globo 3D satellitare — solo desktop"
        >
          3D Terra
        </button>
      ) : (
        <span
          className="px-3 py-2 text-[10px] font-medium text-forest-500 border-l border-forest-700/50"
          title="3D disabilitato su mobile per stabilità"
        >
          3D desktop
        </span>
      )}
    </div>
  );
}
