"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-leaflet";
import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import { HotspotPreviewCard, ReportPreviewCard, SpyZonePreviewCard } from "./MapPreviewCard";

export type MapPreviewTarget =
  | { kind: "hotspot"; hotspot: MapHotspot; lat: number; lng: number }
  | { kind: "report"; report: MushroomReport; lat: number; lng: number }
  | { kind: "spy"; zone: SpyZoneMarker; lat: number; lng: number };

interface MapPreviewOverlayProps {
  target: MapPreviewTarget | null;
}

export default function MapPreviewOverlay({ target }: MapPreviewOverlayProps) {
  const map = useMap();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );

  useEffect(() => {
    setContainer(map.getContainer());
  }, [map]);

  useEffect(() => {
    if (!target) {
      setPosition(null);
      return;
    }

    const update = () => {
      const point = map.latLngToContainerPoint([target.lat, target.lng]);
      setPosition({ x: point.x, y: point.y });
    };

    update();
    map.on("move", update);
    map.on("zoom", update);
    map.on("resize", update);

    return () => {
      map.off("move", update);
      map.off("zoom", update);
      map.off("resize", update);
    };
  }, [map, target]);

  if (!container || !target || !position) return null;

  const mapSize = map.getSize();
  const cardW = 228;
  const cardH = 132;
  let left = position.x + 18;
  let top = position.y - cardH / 2;

  if (left + cardW > mapSize.x - 8) left = position.x - cardW - 18;
  if (left < 8) left = 8;
  if (top < 8) top = 8;
  if (top + cardH > mapSize.y - 8) top = mapSize.y - cardH - 8;

  return createPortal(
    <div
      className="absolute z-[1000] pointer-events-none animate-[preview-in_0.15s_ease-out]"
      style={{ left, top, width: cardW }}
    >
      {target.kind === "hotspot" ? (
        <HotspotPreviewCard hotspot={target.hotspot} />
      ) : target.kind === "report" ? (
        <ReportPreviewCard report={target.report} />
      ) : (
        <SpyZonePreviewCard zone={target.zone} />
      )}
    </div>,
    container
  );
}
