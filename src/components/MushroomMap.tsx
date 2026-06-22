"use client";

import { useEffect, useMemo, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  CircleMarker,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import {
  ESRI_SATELLITE_URL,
  scoreToColor,
  scoreToRadius,
  SPECIES_COLORS,
} from "@/lib/mapUtils";
import MapLabelLayers from "./map/MapLabelLayers";
import { BENEVENTO } from "@/lib/benevento";
import { MAP_DEFAULT_ZOOM } from "@/lib/mockData";
import type { GeoPoint } from "@/lib/geoUtils";
import type { ServiceTier } from "@/lib/tierUtils";
import { safeMapCoordinatesForTier } from "@/lib/tierUtils";
import { getHotspotMapCenter } from "@/lib/zoneCoordinateService";
import UserReportMarkers from "./UserReportMarkers";
import SpyZoneMarkers from "./SpyZoneMarkers";
import MapPreviewOverlay, {
  type MapPreviewTarget,
} from "./map/MapPreviewOverlay";
import { useMapMarkerActivation } from "@/hooks/useMapMarkerActivation";

interface MushroomMapProps {
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

function MapController({
  selectedZoneId,
  selectedReportId,
  selectedSpyZoneId,
  hotspots,
  userReports,
  spyZones,
  tier = "free",
}: {
  selectedZoneId: string | null;
  selectedReportId?: string | null;
  selectedSpyZoneId?: string | null;
  hotspots: MapHotspot[];
  userReports?: MushroomReport[];
  spyZones?: SpyZoneMarker[];
  tier?: ServiceTier;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedZoneId) {
      const hotspot = hotspots.find((h) => h.zone.id === selectedZoneId);
      if (hotspot) {
        const [lat, lng] = getHotspotMapCenter(hotspot, tier);
        map.flyTo([lat, lng], tier === "premium" ? 14 : 13, {
          duration: 1.2,
        });
      }
    }
  }, [selectedZoneId, hotspots, map, tier]);

  useEffect(() => {
    if (selectedReportId && userReports) {
      const report = userReports.find((r) => r.id === selectedReportId);
      if (report) {
        map.flyTo([report.lat, report.lng], 16, { duration: 1.2 });
      }
    }
  }, [selectedReportId, userReports, map]);

  useEffect(() => {
    if (selectedSpyZoneId && spyZones) {
      const zone = spyZones.find((z) => z.id === selectedSpyZoneId);
      if (zone) {
        map.flyTo([zone.lat, zone.lng], 16, { duration: 1.2 });
      }
    }
  }, [selectedSpyZoneId, spyZones, map]);

  return null;
}

/** Ricentra mappa quando cambia origine (MapContainer center è solo iniziale) */
function OriginRecenter({
  origin,
  rangeKm,
}: {
  origin: GeoPoint;
  rangeKm: number;
}) {
  const map = useMap();

  useEffect(() => {
    const zoom =
      rangeKm <= 40 ? 10 : rangeKm <= 80 ? 9 : rangeKm <= 120 ? 8 : 7;
    map.setView([origin.lat, origin.lng], zoom, { animate: true });
  }, [origin.lat, origin.lng, rangeKm, map]);

  return null;
}

function MapDragListener({
  onMapDragChange,
}: {
  onMapDragChange?: (dragging: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!onMapDragChange) return;
    const start = () => onMapDragChange(true);
    const end = () => onMapDragChange(false);
    map.on("dragstart", start);
    map.on("dragend", end);
    map.on("movestart", start);
    map.on("moveend", end);
    return () => {
      map.off("dragstart", start);
      map.off("dragend", end);
      map.off("movestart", start);
      map.off("moveend", end);
    };
  }, [map, onMapDragChange]);

  return null;
}

function MapPreviewController({
  preview,
  setPreview,
}: {
  preview: MapPreviewTarget | null;
  setPreview: (target: MapPreviewTarget | null) => void;
}) {
  useMapEvents({
    click: () => setPreview(null),
    dragstart: () => setPreview(null),
  });

  return <MapPreviewOverlay target={preview} />;
}

function HeatmapOverlay({
  hotspots,
  tier = "free",
}: {
  hotspots: MapHotspot[];
  tier?: ServiceTier;
}) {
  const sorted = useMemo(
    () => [...hotspots].sort((a, b) => a.activeScore - b.activeScore),
    [hotspots]
  );

  return (
    <>
      {sorted.map((hotspot) => {
        const center: [number, number] = safeMapCoordinatesForTier(
          tier,
          hotspot.zone.lat,
          hotspot.zone.lng,
          hotspot.zone.id,
          hotspot.zone.parkingLat,
          hotspot.zone.parkingLng
        );
        const radius =
          tier === "premium"
            ? scoreToRadius(hotspot.activeScore)
            : scoreToRadius(hotspot.activeScore) * 1.8;

        return (
          <Circle
            key={`heat-${hotspot.zone.id}`}
            center={center}
            radius={radius}
            pathOptions={{
              fillColor: scoreToColor(hotspot.activeScore),
              fillOpacity: tier === "premium" ? 0.55 : 0.35,
              color: scoreToColor(hotspot.activeScore),
              weight: 1,
              opacity: tier === "premium" ? 0.3 : 0.15,
            }}
          />
        );
      })}
    </>
  );
}

function HotspotMarkers({
  hotspots,
  selectedZoneId,
  onHotspotOpen,
  setPreview,
  tier = "free",
}: {
  hotspots: MapHotspot[];
  selectedZoneId: string | null;
  onHotspotOpen: (hotspot: MapHotspot) => void;
  setPreview: (target: MapPreviewTarget | null) => void;
  tier?: ServiceTier;
}) {
  const { activate, doubleActivate, hoverPreview, hoverEnd } =
    useMapMarkerActivation();

  return (
    <>
      {hotspots.map((hotspot) => {
        const isSelected = hotspot.zone.id === selectedZoneId;
        const color = SPECIES_COLORS[hotspot.activeSpecies];
        const center: [number, number] = safeMapCoordinatesForTier(
          tier,
          hotspot.zone.lat,
          hotspot.zone.lng,
          hotspot.zone.id,
          hotspot.zone.parkingLat,
          hotspot.zone.parkingLng
        );

        const showPreview = () =>
          setPreview({
            kind: "hotspot",
            hotspot,
            lat: center[0],
            lng: center[1],
          });

        const openDetail = () => {
          setPreview(null);
          onHotspotOpen(hotspot);
        };

        return (
          <CircleMarker
            key={hotspot.zone.id}
            center={center}
            radius={isSelected ? 14 : tier === "premium" ? 11 : 9}
            pathOptions={{
              fillColor: color,
              fillOpacity: isSelected ? 1 : tier === "premium" ? 0.85 : 0.55,
              color: isSelected ? "#ffffff" : color,
              weight: isSelected ? 3 : 2,
              dashArray: tier === "premium" ? undefined : "4 4",
            }}
            eventHandlers={{
              mouseover: () => hoverPreview(showPreview),
              mouseout: () => hoverEnd(() => setPreview(null)),
              click: (e) =>
                activate(hotspot.zone.id, e, showPreview, openDetail),
              dblclick: (e) => doubleActivate(e, openDetail),
            }}
          />
        );
      })}
    </>
  );
}

export default function MushroomMap({
  hotspots,
  selectedZoneId,
  onHotspotClick,
  rangeKm,
  origin = BENEVENTO,
  userReports = [],
  selectedReportId = null,
  onReportClick,
  spyZones = [],
  selectedSpyZoneId = null,
  onSpyZoneClick,
  tier = "free",
  onMapDragChange,
}: MushroomMapProps) {
  const [preview, setPreview] = useState<MapPreviewTarget | null>(null);

  useEffect(() => {
    if (selectedZoneId || selectedReportId || selectedSpyZoneId) {
      setPreview(null);
    }
  }, [selectedZoneId, selectedReportId, selectedSpyZoneId]);

  return (
    <MapContainer
      center={[origin.lat, origin.lng]}
      zoom={MAP_DEFAULT_ZOOM}
      className="w-full h-full"
      zoomControl={true}
      maxZoom={20}
      minZoom={8}
    >
      <TileLayer
        url={ESRI_SATELLITE_URL}
        attribution='Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics'
        maxZoom={19}
      />
      <MapLabelLayers />

      <Circle
        center={[origin.lat, origin.lng]}
        radius={rangeKm * 1000}
        pathOptions={{
          fillColor: "#3b82f6",
          fillOpacity: 0.06,
          color: "#3b82f6",
          weight: 2,
          dashArray: "8 6",
          opacity: 0.5,
        }}
      />
      <CircleMarker
        center={[origin.lat, origin.lng]}
        radius={7}
        pathOptions={{
          fillColor: "#3b82f6",
          fillOpacity: 1,
          color: "#ffffff",
          weight: 2,
        }}
      />
      <HeatmapOverlay hotspots={hotspots} tier={tier} />
      <HotspotMarkers
        hotspots={hotspots}
        selectedZoneId={selectedZoneId}
        onHotspotOpen={onHotspotClick}
        setPreview={setPreview}
        tier={tier}
      />
      {onReportClick && (
        <UserReportMarkers
          reports={userReports}
          selectedReportId={selectedReportId}
          onReportClick={onReportClick}
          setPreview={setPreview}
        />
      )}
      {onSpyZoneClick && (
        <SpyZoneMarkers
          zones={spyZones}
          selectedId={selectedSpyZoneId}
          onZoneClick={onSpyZoneClick}
          setPreview={setPreview}
        />
      )}

      <MapPreviewController preview={preview} setPreview={setPreview} />
      <MapDragListener onMapDragChange={onMapDragChange} />
      <OriginRecenter origin={origin} rangeKm={rangeKm} />
      <MapController
        selectedZoneId={selectedZoneId}
        selectedReportId={selectedReportId}
        selectedSpyZoneId={selectedSpyZoneId}
        hotspots={hotspots}
        userReports={userReports}
        spyZones={spyZones}
        tier={tier}
      />
    </MapContainer>
  );
}
