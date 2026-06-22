"use client";

import { Circle, CircleMarker } from "react-leaflet";
import type { SpyZoneMarker } from "@/lib/types";
import type { MapPreviewTarget } from "./map/MapPreviewOverlay";
import { useMapMarkerActivation } from "@/hooks/useMapMarkerActivation";

interface SpyZoneMarkersProps {
  zones: SpyZoneMarker[];
  selectedId: string | null;
  onZoneClick: (zone: SpyZoneMarker) => void;
  setPreview: (target: MapPreviewTarget | null) => void;
}

export default function SpyZoneMarkers({
  zones,
  selectedId,
  onZoneClick,
  setPreview,
}: SpyZoneMarkersProps) {
  const { activate, doubleActivate, hoverPreview, hoverEnd } =
    useMapMarkerActivation();

  return (
    <>
      {zones.map((zone) => {
        const isSelected = zone.id === selectedId;

        const showPreview = () =>
          setPreview({
            kind: "spy",
            zone,
            lat: zone.lat,
            lng: zone.lng,
          });

        const openDetail = () => {
          setPreview(null);
          onZoneClick(zone);
        };

        return (
          <span key={zone.id}>
            <Circle
              center={[zone.lat, zone.lng]}
              radius={35}
              pathOptions={{
                fillColor: "#f59e0b",
                fillOpacity: isSelected ? 0.22 : 0.12,
                color: "#f59e0b",
                weight: isSelected ? 2 : 1,
                dashArray: "6 4",
                opacity: 0.85,
              }}
            />
            <CircleMarker
              center={[zone.lat, zone.lng]}
              radius={isSelected ? 11 : 9}
              pathOptions={{
                fillColor: "#f59e0b",
                fillOpacity: 1,
                color: "#1a2e1a",
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                mouseover: () => hoverPreview(showPreview),
                mouseout: () => hoverEnd(() => setPreview(null)),
                click: (e) => activate(zone.id, e, showPreview, openDetail),
                dblclick: (e) => doubleActivate(e, openDetail),
              }}
            />
          </span>
        );
      })}
    </>
  );
}
