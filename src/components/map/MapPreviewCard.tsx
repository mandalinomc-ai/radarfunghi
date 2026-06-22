"use client";

import type { MapHotspot, MushroomReport, SpyZoneMarker } from "@/lib/types";
import { getProbabilityLevel } from "@/lib/mapUtils";
import { getSpeciesLabel } from "@/lib/predictionEngine";

const LEVEL_STYLE = {
  alta: "text-orange-300 bg-orange-600/30",
  media: "text-amber-300 bg-amber-600/25",
  bassa: "text-forest-400 bg-forest-700/50",
} as const;

const REPORT_TYPE_LABELS: Record<MushroomReport["reportType"], string> = {
  bottata: "Bottata",
  spia: "Spia",
  ritrovamento: "Ritrovamento",
};

export function HotspotPreviewCard({ hotspot }: { hotspot: MapHotspot }) {
  const level = getProbabilityLevel(hotspot.activeScore);
  const levelStyle = LEVEL_STYLE[level];

  return (
    <div className="map-preview-card pointer-events-none select-none">
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="text-xs font-bold text-forest-100 truncate leading-tight">
            {hotspot.zone.name}
          </p>
          <p className="text-[10px] text-forest-500 truncate">
            {hotspot.zone.region} · {hotspot.zone.altitude} m
          </p>
        </div>
        <span
          className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-md ${levelStyle}`}
        >
          {hotspot.activeScore}%
        </span>
      </div>
      <p className="text-[11px] text-forest-300">
        <span className="text-mushroom-400 font-semibold">
          {getSpeciesLabel(hotspot.activeSpecies)}
        </span>
        {" · "}
        {hotspot.zone.forestType}
      </p>
      <p className="text-[10px] text-forest-500 mt-1">
        📍 {hotspot.zone.kmFromBenevento} km · ⏱{" "}
        {hotspot.zone.driveMinutesFromBenevento} min
      </p>
      <p className="text-[9px] text-forest-600 mt-2 pt-1.5 border-t border-forest-700/40">
        Doppio tap / doppio click → dettaglio completo
      </p>
    </div>
  );
}

export function ReportPreviewCard({ report }: { report: MushroomReport }) {
  const speciesLabel =
    report.species === "sconosciuto"
      ? "Specie non indicata"
      : getSpeciesLabel(report.species);
  const date = new Date(report.createdAt).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

  return (
    <div className="map-preview-card pointer-events-none select-none">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">📍</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-green-200 truncate">
            Segnalazione utente
          </p>
          <p className="text-[10px] text-forest-500">{date}</p>
        </div>
      </div>
      <p className="text-[11px] text-forest-300">
        <span className="text-green-400 font-semibold">
          {REPORT_TYPE_LABELS[report.reportType]}
        </span>
        {" · "}
        {speciesLabel}
      </p>
      {report.note && (
        <p className="text-[10px] text-forest-500 mt-1 line-clamp-2">
          {report.note}
        </p>
      )}
      <p className="text-[9px] text-forest-600 mt-2 pt-1.5 border-t border-forest-700/40">
        Doppio tap / doppio click → scheda segnalazione
      </p>
    </div>
  );
}

export function SpyZonePreviewCard({ zone }: { zone: SpyZoneMarker }) {
  const speciesLabel =
    zone.species === "sconosciuto"
      ? "Specie non indicata"
      : getSpeciesLabel(zone.species);

  return (
    <div className="map-preview-card pointer-events-none select-none border-amber-500/20">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">👁</span>
        <div className="min-w-0">
          <p className="text-xs font-bold text-amber-200 truncate">
            {zone.label}
          </p>
          <p className="text-[10px] text-forest-500">Zona spia community</p>
        </div>
      </div>
      <p className="text-[11px] text-forest-300">{speciesLabel}</p>
      {zone.matchedZoneName && (
        <p className="text-[10px] text-amber-400/80 mt-0.5 truncate">
          ≈ {zone.matchedZoneName}
        </p>
      )}
      <p className="text-[9px] text-forest-600 mt-2 pt-1.5 border-t border-forest-700/40">
        Doppio tap → export e salvataggio
      </p>
    </div>
  );
}
