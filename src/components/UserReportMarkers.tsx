"use client";

import { Circle, CircleMarker } from "react-leaflet";
import type { MushroomReport } from "@/lib/types";
import type { MapPreviewTarget } from "./map/MapPreviewOverlay";
import { useMapMarkerActivation } from "@/hooks/useMapMarkerActivation";

interface UserReportMarkersProps {
  reports: MushroomReport[];
  selectedReportId: string | null;
  onReportClick: (report: MushroomReport) => void;
  setPreview: (target: MapPreviewTarget | null) => void;
}

export default function UserReportMarkers({
  reports,
  selectedReportId,
  onReportClick,
  setPreview,
}: UserReportMarkersProps) {
  const { activate, doubleActivate, hoverPreview, hoverEnd } =
    useMapMarkerActivation();

  return (
    <>
      {reports.map((report) => {
        const isSelected = report.id === selectedReportId;
        const radius = report.accuracyMeters
          ? Math.min(Math.max(report.accuracyMeters, 8), 80)
          : 25;

        const showPreview = () =>
          setPreview({
            kind: "report",
            report,
            lat: report.lat,
            lng: report.lng,
          });

        const openDetail = () => {
          setPreview(null);
          onReportClick(report);
        };

        return (
          <span key={report.id}>
            <Circle
              center={[report.lat, report.lng]}
              radius={radius}
              pathOptions={{
                fillColor: "#22c55e",
                fillOpacity: isSelected ? 0.2 : 0.1,
                color: "#22c55e",
                weight: isSelected ? 2 : 1,
                dashArray: "4 4",
                opacity: 0.7,
              }}
            />
            <CircleMarker
              center={[report.lat, report.lng]}
              radius={isSelected ? 12 : 10}
              pathOptions={{
                fillColor: "#22c55e",
                fillOpacity: 1,
                color: "#ffffff",
                weight: isSelected ? 3 : 2,
              }}
              eventHandlers={{
                mouseover: () => hoverPreview(showPreview),
                mouseout: () => hoverEnd(() => setPreview(null)),
                click: (e) => activate(report.id, e, showPreview, openDetail),
                dblclick: (e) => doubleActivate(e, openDetail),
              }}
            />
          </span>
        );
      })}
    </>
  );
}
