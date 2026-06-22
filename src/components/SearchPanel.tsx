"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useMushroomRadarContext } from "@/context/MushroomRadarContext";
import {
  MOBILE_DOCK_HANDLE_PX,
  MOBILE_DOCK_COLLAPSED_PX,
} from "@/lib/mobileLayout";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  MAX_SEARCH_RADIUS_KM,
  MIN_SEARCH_RADIUS_KM,
} from "@/lib/benevento";
import {
  PROBABILITY_FILTER_OPTIONS,
  type ProbabilityFilter,
} from "@/lib/mapUtils";
import {
  formatHour,
  formatHourRange,
  type HourRange,
} from "@/lib/timeRange";
import { dayOffsetFromToday, formatDateLabel } from "@/lib/dateUtils";
import type { MushroomSpecies } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";
import {
  AdvancedSearchForm,
  type SearchCriteria,
} from "./AdvancedSearchDrawer";
import PremiumUpgradeBanner from "./PremiumUpgradeBanner";
import SeasonalSpeciesBanner from "./SeasonalSpeciesBanner";
import { FORAGING_PRESETS, type ForagingPreset } from "@/lib/foragingPresets";

interface SearchPanelProps {
  selectedDate: string;
  hourRange: HourRange;
  rangeKm: number;
  probabilityFilter: ProbabilityFilter;
  visibleZones: number;
  totalZones: number;
  visibleHotspots: number;
  totalHotspots: number;
  originName: string;
  species: MushroomSpecies | "all";
  onQuickDay: (offset: number) => void;
  onHourRangeChange: (range: HourRange) => void;
  onRangeChange: (km: number) => void;
  onProbabilityFilterChange: (filter: ProbabilityFilter) => void;
  mobileToolbar?: ReactNode;
  onMobileExpandedChange?: (expanded: boolean) => void;
  onMapCompactChange?: (compact: boolean) => void;
  maxDayOffset?: number;
  mapCompact?: boolean;
  criteria?: SearchCriteria;
  onCriteriaChange?: (c: SearchCriteria) => void;
  onSearch?: () => void;
  onApplyPreset?: (preset: ForagingPreset) => void;
  onGoToBest?: () => void;
  bestHotspotScore?: number;
  hasBestHotspot?: boolean;
}

const DAY_LABELS = ["Oggi", "Domani", "Dopodomani", "+3g", "+4g"];

const SLIDER_CLASS =
  "w-full h-3 md:h-2 rounded-full appearance-none cursor-pointer touch-manipulation bg-gradient-to-r from-forest-800 via-mushroom-500/50 to-forest-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-7 [&::-webkit-slider-thumb]:h-7 [&::-webkit-slider-thumb]:md:w-5 [&::-webkit-slider-thumb]:md:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mushroom-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-forest-900 [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:w-7 [&::-moz-range-thumb]:h-7 [&::-moz-range-thumb]:md:w-5 [&::-moz-range-thumb]:md:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-mushroom-400 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-forest-900";

export default function SearchPanel({
  selectedDate,
  hourRange,
  rangeKm,
  probabilityFilter,
  visibleZones,
  totalZones,
  visibleHotspots,
  totalHotspots,
  originName,
  species,
  onQuickDay,
  onHourRangeChange,
  onRangeChange,
  onProbabilityFilterChange,
  mobileToolbar,
  onMobileExpandedChange,
  onMapCompactChange,
  maxDayOffset = 14,
  mapCompact = false,
  criteria,
  onCriteriaChange,
  onSearch,
  onApplyPreset,
  onGoToBest,
  bestHotspotScore = 0,
  hasBestHotspot = false,
}: SearchPanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    onMobileExpandedChange?.(mobileExpanded);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--mobile-dock",
        mobileExpanded ? "44dvh" : `${MOBILE_DOCK_COLLAPSED_PX}px`
      );
    }
  }, [mobileExpanded, onMobileExpandedChange]);

  const handleTouchStart = (y: number) => {
    touchStartY.current = y;
  };

  const handleTouchEnd = (y: number) => {
    if (touchStartY.current == null) return;
    const delta = touchStartY.current - y;
    touchStartY.current = null;
    if (delta > 40) setMobileExpanded(true);
    if (delta < -40) setMobileExpanded(false);
  };

  const currentOffset = dayOffsetFromToday(selectedDate);
  const speciesLabel =
    species === "all" ? "tutte le specie" : getSpeciesLabel(species);

  const handleStartHourChange = (startHour: number) => {
    onHourRangeChange({
      startHour,
      endHour: Math.max(startHour, hourRange.endHour),
    });
  };

  const handleEndHourChange = (endHour: number) => {
    onHourRangeChange({
      startHour: Math.min(hourRange.startHour, endHour),
      endHour,
    });
  };

  const radiusLabel =
    rangeKm >= MAX_SEARCH_RADIUS_KM
      ? `${rangeKm} km (max)`
      : `${rangeKm} km da ${originName}`;

  useEffect(() => {
    onMapCompactChange?.(mapCompact);
    if (mapCompact && typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--mobile-dock",
        `${MOBILE_DOCK_HANDLE_PX}px`
      );
    }
  }, [mapCompact, onMapCompactChange]);

  const dayButtons = (onPick: (idx: number) => void) =>
    DAY_LABELS.map((label, idx) => {
      const locked = idx > maxDayOffset;
      return (
        <button
          key={label}
          disabled={locked}
          onClick={() => !locked && onPick(idx)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation ${
            locked
              ? "bg-forest-900 text-forest-600 opacity-60"
              : currentOffset === idx
                ? "bg-mushroom-500 text-white"
                : "bg-forest-800 text-forest-300"
          }`}
        >
          {locked ? `🔒 ${label}` : label}
        </button>
      );
    });

  const presetBar =
    onApplyPreset && (
      <div className="space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-forest-400">
          Preset cacciatore
        </p>
        <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
          {FORAGING_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-medium bg-forest-800 text-forest-300 hover:bg-forest-700 touch-manipulation"
            >
              {preset.icon} {preset.label}
            </button>
          ))}
        </div>
        {hasBestHotspot && onGoToBest && (
          <button
            type="button"
            onClick={onGoToBest}
            className="w-full py-2 rounded-lg text-xs font-semibold bg-mushroom-600/80 hover:bg-mushroom-500 text-white touch-manipulation"
          >
            🎯 Migliore zona ({bestHotspotScore}% Sprout Score)
          </button>
        )}
      </div>
    );

  return (
    <>
    <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-auto safe-bottom md:hidden">
      <div className="bg-forest-900/95 backdrop-blur-md border-t border-forest-600/40 shadow-[0_-8px_32px_rgba(0,0,0,0.35)]">
        {!mapCompact && mobileToolbar}

        {/* Mobile dock compatto — handle 48px + swipe */}
        <div
          className="md:hidden px-2 py-1 space-y-1.5"
          onTouchStart={(e) => handleTouchStart(e.touches[0].clientY)}
          onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientY)}
        >
          <button
            type="button"
            onClick={() => setMobileExpanded((v) => !v)}
            className="w-full flex items-center justify-between gap-2 touch-manipulation min-h-[48px]"
            aria-expanded={mobileExpanded}
          >
            <div className="min-w-0 text-left">
              <p className="text-[9px] uppercase tracking-wider text-forest-400">
                Timeline · {formatDateLabel(selectedDate)}
              </p>
              <p className="text-sm font-semibold text-forest-200 truncate">
                <span className="text-mushroom-400">
                  {formatHourRange(hourRange)}
                </span>
                <span className="text-forest-500 font-normal text-xs ml-1.5">
                  · {rangeKm} km · {visibleHotspots} zone
                </span>
              </p>
            </div>
            <span className="shrink-0 w-8 h-8 rounded-lg bg-forest-800 flex items-center justify-center text-forest-300 text-sm">
              {mobileExpanded ? "▲" : "▼"}
            </span>
          </button>

          <div className="flex gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {dayButtons(onQuickDay)}
          </div>

          {mobileExpanded && (
            <div className="max-h-[36dvh] overflow-y-auto overscroll-contain space-y-3 pt-2 border-t border-forest-700/30">
              {presetBar}
              <HourSliders
                hourRange={hourRange}
                onStart={handleStartHourChange}
                onEnd={handleEndHourChange}
              />
              <RadiusBlock
                radiusLabel={radiusLabel}
                rangeKm={rangeKm}
                visibleZones={visibleZones}
                totalZones={totalZones}
                speciesLabel={speciesLabel}
                onRangeChange={onRangeChange}
              />
              <ProbabilityBlock
                visibleHotspots={visibleHotspots}
                totalHotspots={totalHotspots}
                probabilityFilter={probabilityFilter}
                onChange={onProbabilityFilterChange}
              />
            </div>
          )}
        </div>
      </div>
    </div>

    {/* Desktop sidebar 320px */}
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-[320px] md:z-[1001] md:border-r md:border-forest-600/40 md:bg-forest-900/98 md:overflow-hidden md:pointer-events-auto">
      <div className="shrink-0 px-4 py-3 border-b border-forest-700/40 bg-forest-950/40">
        <h1 className="text-base font-bold text-forest-200 tracking-tight">
          🍄 Mushroom<span className="text-mushroom-400">Radar</span>
        </h1>
        <p className="text-[10px] text-forest-500 mt-0.5">
          Ricerca · timeline · filtri
        </p>
      </div>
      {criteria && onCriteriaChange && onSearch && (
        <div className="p-4 border-b border-forest-700/40 space-y-3 shrink-0 max-h-[42vh] overflow-y-auto overscroll-contain">
          <AdvancedSearchForm
            criteria={criteria}
            onCriteriaChange={onCriteriaChange}
            onSearch={onSearch}
          />
          <PremiumUpgradeBanner />
        </div>
      )}
      <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0">
        <SeasonalSpeciesBanner />
        <div className="flex items-center justify-between gap-4 mb-2">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-forest-400">
              Timeline predittiva
            </p>
            <p className="text-base font-semibold text-forest-300 truncate">
              {formatDateLabel(selectedDate)}{" "}
              <span className="text-mushroom-400">
                {formatHourRange(hourRange)}
              </span>
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">{dayButtons(onQuickDay)}</div>
        {presetBar}
        <HourSliders
          hourRange={hourRange}
          onStart={handleStartHourChange}
          onEnd={handleEndHourChange}
        />
        <RadiusBlock
          radiusLabel={radiusLabel}
          rangeKm={rangeKm}
          visibleZones={visibleZones}
          totalZones={totalZones}
          speciesLabel={speciesLabel}
          onRangeChange={onRangeChange}
          showMaxButton
        />
        <ProbabilityBlock
          visibleHotspots={visibleHotspots}
          totalHotspots={totalHotspots}
          probabilityFilter={probabilityFilter}
          onChange={onProbabilityFilterChange}
        />
      </div>
    </aside>
    </>
  );
}

function HourSliders({
  hourRange,
  onStart,
  onEnd,
}: {
  hourRange: HourRange;
  onStart: (h: number) => void;
  onEnd: (h: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-forest-400">Da</span>
          <span className="text-xs text-mushroom-400">
            {formatHour(hourRange.startHour)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={hourRange.startHour}
          onChange={(e) => onStart(Number(e.target.value))}
          className={SLIDER_CLASS}
        />
      </div>
      <div>
        <div className="flex justify-between mb-1">
          <span className="text-[10px] text-forest-400">A</span>
          <span className="text-xs text-mushroom-400">
            {formatHour(hourRange.endHour)}
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={23}
          value={hourRange.endHour}
          onChange={(e) => onEnd(Number(e.target.value))}
          className={SLIDER_CLASS}
        />
      </div>
    </div>
  );
}

function RadiusBlock({
  radiusLabel,
  rangeKm,
  visibleZones,
  totalZones,
  speciesLabel,
  onRangeChange,
  showMaxButton,
}: {
  radiusLabel: string;
  rangeKm: number;
  visibleZones: number;
  totalZones: number;
  speciesLabel: string;
  onRangeChange: (km: number) => void;
  showMaxButton?: boolean;
}) {
  return (
    <div className="border-t border-forest-700/30 pt-3 md:border-0 md:pt-0">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-forest-400">
            Raggio
          </p>
          <p className="text-sm font-semibold text-mushroom-400">{radiusLabel}</p>
          <p className="text-[10px] text-forest-500">
            {visibleZones}/{totalZones} zone · {speciesLabel}
          </p>
        </div>
        {showMaxButton && (
          <button
            onClick={() => onRangeChange(DEFAULT_SEARCH_RADIUS_KM)}
            className="shrink-0 px-3 py-1.5 rounded-lg text-xs bg-forest-800 text-forest-300 touch-manipulation"
          >
            Max
          </button>
        )}
      </div>
      <input
        type="range"
        min={MIN_SEARCH_RADIUS_KM}
        max={MAX_SEARCH_RADIUS_KM}
        step={5}
        value={rangeKm}
        onChange={(e) => onRangeChange(Number(e.target.value))}
        className={SLIDER_CLASS}
      />
    </div>
  );
}

function ProbabilityBlock({
  visibleHotspots,
  totalHotspots,
  probabilityFilter,
  onChange,
}: {
  visibleHotspots: number;
  totalHotspots: number;
  probabilityFilter: ProbabilityFilter;
  onChange: (f: ProbabilityFilter) => void;
}) {
  return (
    <div className="border-t border-forest-700/30 pt-3 md:border-0 md:pt-0">
      <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-1">
        Probabilità · {visibleHotspots}/{totalHotspots}
      </p>
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
        {PROBABILITY_FILTER_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation ${
              probabilityFilter === option.id
                ? "bg-mushroom-500 text-white"
                : "bg-forest-800 text-forest-300"
            }`}
          >
            {option.id !== "all" && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: option.color }}
              />
            )}
            {option.shortLabel}
          </button>
        ))}
      </div>
    </div>
  );
}
