import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import type { GeoPoint } from "@/lib/geoUtils";
import type { ServiceTier } from "@/lib/tierUtils";
import { BENEVENTO } from "@/lib/benevento";

export interface MushroomMapProps {
  hotspots: MapHotspot[];
  selectedZoneId: string | null;
  onHotspotClick: (hotspot: MapHotspot) => void;
  rangeKm: number;
  origin?: GeoPoint;
  userReports?: MushroomReport[];
  selectedReportId?: string | null;
  onReportClick?: (report: MushroomReport) => void;
  spyZones?: SpyZoneMarker[];
  selectedSpyZoneId?: string | null;
  onSpyZoneClick?: (zone: SpyZoneMarker) => void;
  tier?: ServiceTier;
  onMapDragChange?: (dragging: boolean) => void;
}

export const MAP_VIEW_MODE_KEY = "mushroomradar-map-view";

export type MapViewMode = "2d" | "3d";

export function loadMapViewMode(): MapViewMode {
  if (typeof window === "undefined") return "2d";
  return sessionStorage.getItem(MAP_VIEW_MODE_KEY) === "3d" ? "3d" : "2d";
}

export function saveMapViewMode(mode: MapViewMode): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(MAP_VIEW_MODE_KEY, mode);
}

export const DEFAULT_MAP_ORIGIN = BENEVENTO;
