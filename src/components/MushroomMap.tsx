"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import MapViewModeToggle from "./map/MapViewModeToggle";
import {
  loadMapViewMode,
  saveMapViewMode,
  type MapViewMode,
  type MushroomMapProps,
} from "./map/mushroomMapProps";

const MushroomMapLeaflet = dynamic(() => import("./MushroomMapLeaflet"), {
  ssr: false,
  loading: () => <MapLoading label="Caricamento mappa 2D…" />,
});

const MushroomMap3D = dynamic(() => import("./MushroomMap3D"), {
  ssr: false,
  loading: () => <MapLoading label="Caricamento globo 3D…" />,
});

function MapLoading({ label }: { label: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-forest-950">
      <div className="text-center px-4">
        <div className="w-10 h-10 border-2 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-forest-400 text-sm">{label}</p>
      </div>
    </div>
  );
}

export type { MushroomMapProps };

export default function MushroomMap(props: MushroomMapProps) {
  const [viewMode, setViewMode] = useState<MapViewMode>(() => loadMapViewMode());

  const handleModeChange = useCallback((mode: MapViewMode) => {
    setViewMode(mode);
    saveMapViewMode(mode);
  }, []);

  return (
    <div className="relative w-full h-full">
      <MapViewModeToggle mode={viewMode} onChange={handleModeChange} />
      {viewMode === "2d" ? (
        <MushroomMapLeaflet {...props} />
      ) : (
        <MushroomMap3D {...props} onSwitchTo2D={() => handleModeChange("2d")} />
      )}
    </div>
  );
}
