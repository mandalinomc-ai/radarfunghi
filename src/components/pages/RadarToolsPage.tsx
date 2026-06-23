"use client";

import { AdvancedSearchForm } from "@/components/AdvancedSearchDrawer";
import ResultsExplanationPanel from "@/components/ResultsExplanationPanel";
import SeasonalSpeciesBanner from "@/components/SeasonalSpeciesBanner";
import { useRadarSearch, ALTITUDE_BANDS } from "@/context/RadarSearchContext";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  MIN_SEARCH_RADIUS_KM,
} from "@/lib/benevento";
import { PROBABILITY_FILTER_OPTIONS } from "@/lib/mapUtils";
import { RADIUS_QUICK_KM } from "@/lib/hourPresets";
import { getSpeciesLabel } from "@/lib/predictionEngine";

export default function RadarToolsPage() {
  const { maxDayOffset } = useMushroomRadarContext();
  const radar = useRadarSearch();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-12">
      <div>
        <h1 className="font-display text-2xl text-sage-100">Radar &amp; Filtri</h1>
        <p className="text-sm text-sage-400 mt-1">
          Timeline predittiva · raggio · quote · scomposizione Sprout Score
        </p>
      </div>

      <div className="enterprise-panel rounded-2xl p-4 md:p-5 space-y-4">
        <SeasonalSpeciesBanner />
        <AdvancedSearchForm
          criteria={radar.criteria}
          onCriteriaChange={radar.setCriteria}
          onSearch={() => radar.refresh()}
        />

        <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-enterprise-border/40">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-sage-500 mb-2">
              Raggio · {radar.rangeKm} km
            </p>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {RADIUS_QUICK_KM.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => radar.setRangeKm(km)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium touch-manipulation ${
                    radar.rangeKm === km
                      ? "bg-mushroom-500 text-white"
                      : "bg-enterprise-bg/80 text-sage-400 border border-enterprise-border/40"
                  }`}
                >
                  {km} km
                </button>
              ))}
              <button
                type="button"
                onClick={() => radar.setRangeKm(MAX_SEARCH_RADIUS_KM)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium touch-manipulation ${
                  radar.rangeKm >= MAX_SEARCH_RADIUS_KM
                    ? "bg-mushroom-500 text-white"
                    : "bg-enterprise-bg/80 text-sage-400 border border-enterprise-border/40"
                }`}
              >
                Max
              </button>
            </div>
            <input
              type="range"
              min={MIN_SEARCH_RADIUS_KM}
              max={MAX_SEARCH_RADIUS_KM}
              step={5}
              value={radar.rangeKm}
              onChange={(e) => radar.setRangeKm(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none bg-forest-800 accent-mushroom-500"
            />
            <p className="text-[10px] text-sage-500 mt-1">
              {radar.filteredHotspots.length} zone nel raggio ·{" "}
              {radar.criteria.species === "all"
                ? "tutte le specie"
                : getSpeciesLabel(radar.criteria.species)}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-sage-500 mb-2">
              Probabilità minima
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROBABILITY_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => radar.setProbabilityFilter(option.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold touch-manipulation ${
                    radar.probabilityFilter === option.id
                      ? "bg-mushroom-500 text-white"
                      : "bg-enterprise-bg/80 text-sage-400 border border-enterprise-border/40"
                  }`}
                >
                  {option.id !== "all" && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: option.color }}
                    />
                  )}
                  {option.shortLabel}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-sage-500 mt-2">
              Offset max {maxDayOffset} giorni · default {DEFAULT_SEARCH_RADIUS_KM} km
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {ALTITUDE_BANDS.map((band) => (
          <button
            key={band.id}
            type="button"
            onClick={() => radar.setAltitudeBand(band.id)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold touch-manipulation ${
              radar.altitudeBand === band.id
                ? "bg-neon/15 text-neon border border-neon/35"
                : "bg-enterprise-panel/60 text-sage-300 border border-enterprise-border/40"
            }`}
          >
            {band.label}
          </button>
        ))}
      </div>

      <ResultsExplanationPanel
        hotspots={radar.filteredHotspots.slice(0, 8)}
        criteria={radar.criteria}
      />
    </div>
  );
}
