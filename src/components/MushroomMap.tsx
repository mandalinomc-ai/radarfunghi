"use client";

import { useEffect, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
} from "react-leaflet";
import type { MapHotspot } from "@/lib/types";
import {
  ESRI_HYBRID_LABELS_URL,
  ESRI_SATELLITE_URL,
  scoreToColor,
  scoreToRadius,
  SPECIES_COLORS,
} from "@/lib/mapUtils";
import { BENEVENTO } from "@/lib/benevento";
import { MAP_CENTER, MAP_DEFAULT_ZOOM } from "@/lib/mockData";

interface MushroomMapProps {
  hotspots: MapHotspot[];
  selectedZoneId: string | null;
  onHotspotClick: (hotspot: MapHotspot) => void;
}

function MapController({ selectedZoneId, hotspots }: {
  selectedZoneId: string | null;
  hotspots: MapHotspot[];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedZoneId) {
      const hotspot = hotspots.find((h) => h.zone.id === selectedZoneId);
      if (hotspot) {
        map.flyTo([hotspot.zone.lat, hotspot.zone.lng], 14, {
          duration: 1.2,
        });
      }
    }
  }, [selectedZoneId, hotspots, map]);

  return null;
}

function HeatmapOverlay({ hotspots }: { hotspots: MapHotspot[] }) {
  const sorted = useMemo(
    () => [...hotspots].sort((a, b) => a.activeScore - b.activeScore),
    [hotspots]
  );

  return (
    <>
      {sorted.map((hotspot) => (
        <Circle
          key={`heat-${hotspot.zone.id}`}
          center={[hotspot.zone.lat, hotspot.zone.lng]}
          radius={scoreToRadius(hotspot.activeScore)}
          pathOptions={{
            fillColor: scoreToColor(hotspot.activeScore),
            fillOpacity: 0.55,
            color: scoreToColor(hotspot.activeScore),
            weight: 1,
            opacity: 0.3,
          }}
        />
      ))}
    </>
  );
}

function HotspotMarkers({
  hotspots,
  selectedZoneId,
  onHotspotClick,
}: {
  hotspots: MapHotspot[];
  selectedZoneId: string | null;
  onHotspotClick: (hotspot: MapHotspot) => void;
}) {
  return (
    <>
      {hotspots.map((hotspot) => {
        const isSelected = hotspot.zone.id === selectedZoneId;
        const color = SPECIES_COLORS[hotspot.activeSpecies];

        return (
          <CircleMarker
            key={hotspot.zone.id}
            center={[hotspot.zone.lat, hotspot.zone.lng]}
            radius={isSelected ? 14 : 11}
            pathOptions={{
              fillColor: color,
              fillOpacity: isSelected ? 1 : 0.85,
              color: isSelected ? "#ffffff" : color,
              weight: isSelected ? 3 : 2,
            }}
            eventHandlers={{
              click: (e) => {
                e.originalEvent.stopPropagation();
                onHotspotClick(hotspot);
              },
            }}
          >
          </CircleMarker>
        );
      })}
    </>
  );
}

export default function MushroomMap({
  hotspots,
  selectedZoneId,
  onHotspotClick,
}: MushroomMapProps) {
  return (
    <MapContainer
      center={[MAP_CENTER.lat, MAP_CENTER.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={true}
      maxZoom={19}
      minZoom={8}
    >
      <TileLayer
        url={ESRI_SATELLITE_URL}
        attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        maxZoom={19}
      />
      <TileLayer
        url={ESRI_HYBRID_LABELS_URL}
        attribution=""
        maxZoom={19}
        opacity={0.7}
      />

      <CircleMarker
        center={[BENEVENTO.lat, BENEVENTO.lng]}
        radius={7}
        pathOptions={{
          fillColor: "#3b82f6",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2,
        }}
      />
      <HeatmapOverlay hotspots={hotspots} />
      <HotspotMarkers
        hotspots={hotspots}
        selectedZoneId={selectedZoneId}
        onHotspotClick={onHotspotClick}
      />

      <MapController
        selectedZoneId={selectedZoneId}
        hotspots={hotspots}
      />
    </MapContainer>
  );
}
