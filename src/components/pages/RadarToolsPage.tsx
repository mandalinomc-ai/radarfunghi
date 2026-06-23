"use client";

import SearchPanel from "@/components/SearchPanel";
import { AdvancedSearchForm } from "@/components/AdvancedSearchDrawer";
import ResultsExplanationPanel from "@/components/ResultsExplanationPanel";
import { useRadarSearch, ALTITUDE_BANDS } from "@/context/RadarSearchContext";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import { dayOffsetFromToday } from "@/lib/dateUtils";
import { FORAGING_PRESETS } from "@/lib/foragingPresets";

export default function RadarToolsPage() {
  const { tier, maxDayOffset } = useMushroomRadarContext();
  const radar = useRadarSearch();

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl text-sage-100">Radar &amp; Filtri</h1>
        <p className="text-sm text-sage-400 mt-1">
          Timeline predittiva · raggio · quote · scomposizione Sprout Score
        </p>
      </div>

      <div className="enterprise-panel rounded-2xl overflow-hidden">
        <SearchPanel
          selectedDate={radar.criteria.selectedDate}
          hourRange={radar.criteria.hourRange}
          rangeKm={radar.rangeKm}
          probabilityFilter={radar.probabilityFilter}
          visibleZones={radar.filteredHotspots.length}
          totalZones={radar.liveZones.length}
          visibleHotspots={radar.filteredHotspots.length}
          totalHotspots={radar.filteredHotspots.length}
          originName={radar.criteria.origin.name ?? "Partenza"}
          species={radar.criteria.species}
          onQuickDay={(offset) => {
            const d = new Date();
            d.setDate(d.getDate() + offset);
            radar.setCriteria({
              ...radar.criteria,
              selectedDate: d.toISOString().slice(0, 10),
            });
          }}
          onHourRangeChange={(hourRange) =>
            radar.setCriteria({ ...radar.criteria, hourRange })
          }
          onRangeChange={radar.setRangeKm}
          onProbabilityFilterChange={radar.setProbabilityFilter}
          maxDayOffset={maxDayOffset}
          criteria={radar.criteria}
          onCriteriaChange={radar.setCriteria}
          onSearch={() => radar.refresh()}
          onApplyPreset={(preset) => {
            radar.setCriteria({
              ...radar.criteria,
              ...(preset.hourRange ? { hourRange: preset.hourRange } : {}),
              ...(preset.species ? { species: preset.species } : {}),
              ...(preset.minAltitude != null
                ? { minAltitude: preset.minAltitude }
                : {}),
              ...(preset.maxAltitude != null
                ? { maxAltitude: preset.maxAltitude }
                : {}),
            });
            if (preset.probabilityFilter) {
              radar.setProbabilityFilter(preset.probabilityFilter);
            }
          }}
          onGoToBest={() => {
            if (radar.bestHotspot) radar.setSelectedHotspot(radar.bestHotspot);
          }}
          bestHotspotScore={radar.bestHotspot?.activeScore}
          hasBestHotspot={!!radar.bestHotspot}
        />
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

      <div className="enterprise-panel rounded-2xl p-4 md:p-5">
        <h2 className="text-sm font-semibold text-sage-200 mb-3">
          Preset &amp; ricerca avanzata
        </h2>
        <AdvancedSearchForm
          criteria={radar.criteria}
          onCriteriaChange={radar.setCriteria}
          onSearch={() => radar.refresh()}
        />
        <p className="text-[10px] text-sage-500 mt-3">
          Offset giorno attuale: {dayOffsetFromToday(radar.criteria.selectedDate)} ·
          Preset disponibili: {FORAGING_PRESETS.length}
        </p>
      </div>

      <ResultsExplanationPanel
        hotspots={radar.filteredHotspots.slice(0, 8)}
        criteria={radar.criteria}
      />
    </div>
  );
}
