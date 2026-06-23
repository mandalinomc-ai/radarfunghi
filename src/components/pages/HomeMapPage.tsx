"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import { useRadarSearch } from "@/context/RadarSearchContext";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import { useMapCompactDebounce } from "@/hooks/useMapCompactDebounce";
import LocationDetailPanel from "@/components/LocationDetailPanel";
import { formatHourRange } from "@/lib/timeRange";
import { formatDateLabel } from "@/lib/dateUtils";

const MushroomMap = dynamic(() => import("@/components/MushroomMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-enterprise-bg">
      <div className="w-10 h-10 border-2 border-neon border-t-transparent rounded-full animate-spin" />
    </div>
  ),
});

export default function HomeMapPage() {
  const { tier } = useMushroomRadarContext();
  const radar = useRadarSearch();
  const { onMapDragChange } = useMapCompactDebounce();
  const [mapCompact, setMapCompact] = useState(false);

  const handleMapDrag = useCallback(
    (dragging: boolean) => {
      onMapDragChange(dragging);
      setMapCompact(dragging);
    },
    [onMapDragChange]
  );

  const handleHotspotClick = useCallback(
    (hotspot: (typeof radar.filteredHotspots)[0]) => {
      radar.setSelectedHotspot(hotspot);
    },
    [radar]
  );

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-4rem)]">
      <MushroomMap
        hotspots={radar.filteredHotspots}
        selectedZoneId={radar.selectedHotspot?.zone.id ?? null}
        onHotspotClick={handleHotspotClick}
        rangeKm={radar.rangeKm}
        origin={radar.criteria.origin}
        tier={tier}
        onMapDragChange={handleMapDrag}
      />

      <div
        className={`absolute top-3 left-3 z-[1002] pointer-events-none transition-opacity ${
          mapCompact ? "opacity-0" : "opacity-100"
        }`}
      >
        <div className="enterprise-glass px-3 py-2 rounded-xl max-w-[280px]">
          <p className="text-[10px] uppercase tracking-wider text-neon/90 font-semibold">
            Live Radar
          </p>
          <p className="text-xs text-sage-200 mt-0.5">
            {formatDateLabel(radar.criteria.selectedDate)} ·{" "}
            {formatHourRange(radar.criteria.hourRange)}
          </p>
          <p className="text-[11px] text-sage-400 mt-1">
            {radar.filteredHotspots.length} zone · avg {radar.avgScore}%
            {radar.loading ? " · sync…" : ""}
          </p>
        </div>
      </div>

      {radar.selectedHotspot && (
        <LocationDetailPanel
          hotspot={radar.selectedHotspot}
          hourRange={radar.criteria.hourRange}
          selectedDate={radar.criteria.selectedDate}
          originName={radar.criteria.origin.name ?? "Partenza"}
          origin={radar.criteria.origin}
          tier={tier}
          onClose={() => radar.setSelectedHotspot(null)}
          className="bottom-4 md:bottom-6"
        />
      )}
    </div>
  );
}
