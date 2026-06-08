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
  const fmStatus = getRegionalStatusForZone(zone.region);
  const yields = estimateYields(hotspot, dayOffset);
  const mapsLink = getGoogleMapsDeepLink(
    zone.lat,
    zone.lng,
    zone.parkingLat,
    zone.parkingLng
  );

  return (
    <div className="absolute top-0 right-0 bottom-0 z-[1001] w-full max-w-md pointer-events-auto">
      <div className="h-full bg-forest-900/95 backdrop-blur-lg border-l border-forest-600/40 shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-forest-900/95 backdrop-blur-lg border-b border-forest-600/30 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-forest-200">{zone.name}</h2>
            <p className="text-xs text-forest-400 capitalize">{zone.region}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-300 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center gap-4">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold text-white shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${SPECIES_COLORS[activeSpecies]}, #2d4f2a)`,
              }}
            >
              {activeScore}%
            </div>
            <div>
              <p className="text-sm text-forest-400">Sprout Score</p>
              <p className="text-lg font-semibold text-mushroom-400">
                {getSpeciesLabel(activeSpecies)}
              </p>
              <p className="text-xs text-forest-500 italic">
                {getSpeciesScientific(activeSpecies)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-forest-950/60 rounded-lg p-3 border border-forest-700/30">
              <p className="text-[10px] uppercase tracking-wider text-forest-500">
                Coordinate GPS
              </p>
              <p className="text-sm font-mono text-forest-200 mt-1">
                {formatCoordinates(zone.lat, zone.lng)}
              </p>
            </div>
            <div className="bg-forest-950/60 rounded-lg p-3 border border-forest-700/30">
              <p className="text-[10px] uppercase tracking-wider text-forest-500">
                Quota
              </p>
              <p className="text-sm font-semibold text-forest-200 mt-1">
                {zone.altitude} m s.l.m.
              </p>
            </div>
          </div>

          <div className="bg-forest-950/60 rounded-lg p-3 border border-forest-700/30">
            <p className="text-[10px] uppercase tracking-wider text-forest-500">
              Macchia boschiva
            </p>
            <p className="text-sm text-forest-200 mt-1">{zone.forestType}</p>
            <p className="text-xs text-forest-500 mt-1">
              Esposizione: {zone.exposure.toUpperCase()}
            </p>
          </div>

          {fmStatus && (
            <div className="bg-forest-950/60 rounded-lg p-3 border border-mushroom-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      FM_TRAFFIC_LIGHT_COLORS[fmStatus.trafficLight],
                  }}
                />
                <p className="text-[10px] uppercase tracking-wider text-mushroom-400">
                  Funghimagazine — {FM_TRAFFIC_LIGHT_LABELS[fmStatus.trafficLight]}
                </p>
              </div>
              <p className="text-xs text-forest-300 leading-relaxed">
                {fmStatus.summary}
              </p>
              {fmStatus.porciniFrom && (
                <p className="text-[10px] text-forest-500 mt-1.5">
                  Porcini attesi dal: {fmStatus.porciniFrom}
                </p>
              )}
            </div>
          )}

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
              Dettaglio fattori predittivi
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
                  <div className="grid grid-cols-3 gap-1 text-[10px]">
                    {Object.entries(pred.factors).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <p className="text-forest-500 capitalize">
                          {key.replace("Score", "")}
                        </p>
                        <p className="text-forest-300 font-medium">{val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <a
            href={mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-mushroom-500 to-mushroom-600 hover:from-mushroom-400 hover:to-mushroom-500 text-white text-center font-bold text-sm tracking-wide shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            APRI IN GOOGLE MAPS
          </a>
          <p className="text-[10px] text-forest-500 text-center">
            Navigazione verso parcheggio:{" "}
            {formatCoordinates(zone.parkingLat, zone.parkingLng)}
          </p>
          <p className="text-[10px] text-forest-600 text-center">
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
        </div>
      </div>
    </div>
  );
}
