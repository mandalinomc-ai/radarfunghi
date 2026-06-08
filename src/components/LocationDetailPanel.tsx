"use client";

import type { MapHotspot } from "@/lib/types";
import {
  formatCoordinates,
  getGoogleMapsDeepLink,
  SPECIES_COLORS,
} from "@/lib/mapUtils";
import {
  getSpeciesLabel,
  getSpeciesScientific,
} from "@/lib/predictionEngine";
import CollectionWindowChart from "./CollectionWindowChart";
import {
  getRegionalStatusForZone,
  FM_TRAFFIC_LIGHT_COLORS,
  FM_TRAFFIC_LIGHT_LABELS,
  FM_SOURCE,
} from "@/lib/funghimagazineData";
import { estimateYields } from "@/lib/beginnerGuide";
import { getRegionLabel } from "@/lib/regionLabels";

interface LocationDetailPanelProps {
  hotspot: MapHotspot | null;
  currentHour: number;
  dayOffset: number;
  onClose: () => void;
}

export default function LocationDetailPanel({
  hotspot,
  currentHour,
  dayOffset,
  onClose,
}: LocationDetailPanelProps) {
  if (!hotspot) return null;

  const { zone, predictions, activeScore, activeSpecies } = hotspot;
  const fmStatus = getRegionalStatusForZone(zone.region, zone.id);
  const yields = estimateYields(hotspot, dayOffset);
  const mapsLink = getGoogleMapsDeepLink(
    zone.lat,
    zone.lng,
    zone.parkingLat,
    zone.parkingLng
  );

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div className="md:hidden fixed inset-x-0 bottom-[132px] z-[1002] pointer-events-auto safe-bottom">
        <div className="mx-2 max-h-[58dvh] bg-forest-900/98 backdrop-blur-lg border border-forest-600/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <PanelHeader zone={zone} onClose={onClose} compact />
          <div className="overflow-y-auto overscroll-contain p-4 space-y-4">
            <PanelBody
              activeScore={activeScore}
              activeSpecies={activeSpecies}
              zone={zone}
              fmStatus={fmStatus}
              yields={yields}
              predictions={predictions}
              currentHour={currentHour}
              mapsLink={mapsLink}
              compact
            />
          </div>
        </div>
      </div>

      {/* Desktop: side panel */}
      <div className="hidden md:block absolute top-0 right-0 bottom-0 z-[1001] w-full max-w-md pointer-events-auto">
        <div className="h-full bg-forest-900/95 backdrop-blur-lg border-l border-forest-600/40 shadow-2xl overflow-y-auto">
          <PanelHeader zone={zone} onClose={onClose} />
          <div className="p-5 space-y-5">
            <PanelBody
              activeScore={activeScore}
              activeSpecies={activeSpecies}
              zone={zone}
              fmStatus={fmStatus}
              yields={yields}
              predictions={predictions}
              currentHour={currentHour}
              mapsLink={mapsLink}
            />
          </div>
        </div>
      </div>
    </>
  );
}

function PanelHeader({
  zone,
  onClose,
  compact,
}: {
  zone: MapHotspot["zone"];
  onClose: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`sticky top-0 bg-forest-900/95 backdrop-blur-lg border-b border-forest-600/30 flex items-center justify-between shrink-0 ${
        compact ? "px-4 py-3" : "px-5 py-4"
      }`}
    >
      <div className="min-w-0 pr-2">
        <h2 className="text-base md:text-lg font-bold text-forest-200 truncate">
          {zone.name}
        </h2>
        <p className="text-xs text-forest-400">{getRegionLabel(zone.region)}</p>
      </div>
      <button
        onClick={onClose}
        className="w-10 h-10 shrink-0 rounded-xl bg-forest-800 hover:bg-forest-700 text-forest-300 flex items-center justify-center transition-colors touch-manipulation"
      >
        ✕
      </button>
    </div>
  );
}

function PanelBody({
  activeScore,
  activeSpecies,
  zone,
  fmStatus,
  yields,
  predictions,
  currentHour,
  mapsLink,
  compact,
}: {
  activeScore: number;
  activeSpecies: MapHotspot["activeSpecies"];
  zone: MapHotspot["zone"];
  fmStatus: ReturnType<typeof getRegionalStatusForZone>;
  yields: ReturnType<typeof estimateYields>;
  predictions: MapHotspot["predictions"];
  currentHour: number;
  mapsLink: string;
  compact?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-3 md:gap-4">
        <div
          className="w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg shrink-0"
          style={{
            background: `linear-gradient(135deg, ${SPECIES_COLORS[activeSpecies]}, #2d4f2a)`,
          }}
        >
          {activeScore}%
        </div>
        <div className="min-w-0">
          <p className="text-xs md:text-sm text-forest-400">Sprout Score</p>
          <p className="text-base md:text-lg font-semibold text-mushroom-400 truncate">
            {getSpeciesLabel(activeSpecies)}
          </p>
          <p className="text-[10px] md:text-xs text-forest-500 italic truncate">
            {getSpeciesScientific(activeSpecies)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <InfoBox label="Coordinate GPS" value={formatCoordinates(zone.lat, zone.lng)} mono />
        <InfoBox label="Quota" value={`${zone.altitude} m`} />
      </div>

      <InfoBox label="Macchia boschiva" value={zone.forestType} sub={`Esposizione: ${zone.exposure.toUpperCase()}`} />

      {fmStatus && (
        <div className="bg-forest-950/60 rounded-xl p-3 border border-mushroom-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: FM_TRAFFIC_LIGHT_COLORS[fmStatus.trafficLight],
              }}
            />
            <p className="text-[10px] uppercase tracking-wider text-mushroom-400">
              FM — {FM_TRAFFIC_LIGHT_LABELS[fmStatus.trafficLight]}
            </p>
          </div>
          <p className="text-xs text-forest-300 leading-relaxed">{fmStatus.summary}</p>
        </div>
      )}

      {!compact && (
        <>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Quantità stimata
            </p>
            <div className="space-y-1.5">
              {yields.map((y) => (
                <div
                  key={y.species}
                  className="flex justify-between items-center bg-forest-950/40 rounded-lg px-3 py-2 border border-forest-700/20"
                >
                  <span className="text-xs text-forest-300">{y.label}</span>
                  <span className="text-xs font-bold text-mushroom-400">
                    {y.min}-{y.max} {y.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <CollectionWindowChart zone={zone} currentHour={currentHour} />

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Fattori predittivi
            </p>
            <div className="space-y-2">
              {predictions.map((pred) => (
                <div
                  key={pred.species}
                  className="bg-forest-950/40 rounded-lg p-3 border border-forest-700/20"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-forest-200">
                      {getSpeciesLabel(pred.species)}
                    </span>
                    <span
                      className="text-sm font-bold"
                      style={{ color: SPECIES_COLORS[pred.species] }}
                    >
                      {pred.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <a
        href={mapsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full py-4 rounded-xl bg-gradient-to-r from-mushroom-500 to-mushroom-600 active:from-mushroom-400 active:to-mushroom-500 text-white text-center font-bold text-sm tracking-wide shadow-lg transition-all touch-manipulation"
      >
        🧭 APRI IN GOOGLE MAPS
      </a>
      <p className="text-[10px] text-forest-500 text-center">
        Parcheggio: {formatCoordinates(zone.parkingLat, zone.parkingLng)}
      </p>
      <p className="text-[10px] text-forest-600 text-center pb-1">
        Fonte:{" "}
        <a
          href={FM_SOURCE.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-mushroom-500/70 underline"
        >
          {FM_SOURCE.name}
        </a>
      </p>
    </>
  );
}

function InfoBox({
  label,
  value,
  sub,
  mono,
}: {
  label: string;
  value: string;
  sub?: string;
  mono?: boolean;
}) {
  return (
    <div className="bg-forest-950/60 rounded-lg p-2.5 md:p-3 border border-forest-700/30">
      <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-forest-500">
        {label}
      </p>
      <p
        className={`text-xs md:text-sm text-forest-200 mt-0.5 ${
          mono ? "font-mono" : "font-semibold"
        }`}
      >
        {value}
      </p>
      {sub && <p className="text-[10px] text-forest-500 mt-0.5">{sub}</p>}
    </div>
  );
}
