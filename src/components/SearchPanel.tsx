"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
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
  SPECIES_COLORS,
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
import {
  HOUR_PRESETS,
  RADIUS_QUICK_KM,
  hourPresetMatches,
} from "@/lib/hourPresets";

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
  onOpenFilters?: () => void;
}

const DAY_LABELS = ["Oggi", "Domani", "Dopodomani", "+3g", "+4g"];
const SPECIES_LIST: MushroomSpecies[] = ["porcino", "estatino", "galletto"];

const SLIDER_CLASS =
  "w-full h-3 rounded-full appearance-none cursor-pointer touch-manipulation bg-forest-800 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mushroom-400 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-forest-900 [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-mushroom-400";

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
  onOpenFilters,
}: SearchPanelProps) {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const [customHours, setCustomHours] = useState(false);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    onMobileExpandedChange?.(mobileExpanded);
    if (typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--mobile-dock",
        mobileExpanded ? "52dvh" : `${MOBILE_DOCK_COLLAPSED_PX}px`
      );
    }
  }, [mobileExpanded, onMobileExpandedChange]);

  useEffect(() => {
    onMapCompactChange?.(mapCompact);
    if (mapCompact && typeof document !== "undefined") {
      document.documentElement.style.setProperty(
        "--mobile-dock",
        `${MOBILE_DOCK_HANDLE_PX}px`
      );
    }
  }, [mapCompact, onMapCompactChange]);

  const currentOffset = dayOffsetFromToday(selectedDate);
  const speciesLabel =
    species === "all" ? "Tutte" : getSpeciesLabel(species);

  const applySpecies = (sp: MushroomSpecies | "all") => {
    if (criteria && onCriteriaChange) {
      onCriteriaChange({ ...criteria, species: sp });
    }
  };

  const applyHourPreset = (range: HourRange) => {
    onHourRangeChange(range);
    if (criteria && onCriteriaChange) {
      onCriteriaChange({ ...criteria, hourRange: range });
    }
  };

  const dayButtons = (compact?: boolean) =>
    DAY_LABELS.map((label, idx) => {
      const locked = idx > maxDayOffset;
      const active = currentOffset === idx;
      return (
        <button
          key={label}
          type="button"
          disabled={locked}
          onClick={() => !locked && onQuickDay(idx)}
          className={`${compact ? "flex-1" : "shrink-0"} min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold touch-manipulation transition-colors ${
            locked
              ? "bg-forest-900 text-forest-600 opacity-50"
              : active
                ? "bg-mushroom-500 text-white shadow-md"
                : "bg-forest-800/90 text-forest-200 hover:bg-forest-700"
          }`}
        >
          {locked ? "🔒" : label}
        </button>
      );
    });

  return (
    <>
      {/* ——— Mobile dock ——— */}
      <div className="absolute bottom-0 left-0 right-0 z-[1000] pointer-events-auto safe-bottom md:hidden">
        <div className="bg-forest-900/98 backdrop-blur-lg border-t border-forest-600/40 shadow-[0_-12px_40px_rgba(0,0,0,0.45)] rounded-t-2xl overflow-hidden">
          {!mapCompact && mobileToolbar}

          <div
            className="px-3 pt-2 pb-2"
            onTouchStart={(e) => {
              touchStartY.current = e.touches[0].clientY;
            }}
            onTouchEnd={(e) => {
              if (touchStartY.current == null) return;
              const delta = touchStartY.current - e.changedTouches[0].clientY;
              touchStartY.current = null;
              if (delta > 50) setMobileExpanded(true);
              if (delta < -50) setMobileExpanded(false);
            }}
          >
            <button
              type="button"
              onClick={() => setMobileExpanded((v) => !v)}
              className="w-full flex items-center gap-3 touch-manipulation min-h-[52px]"
              aria-expanded={mobileExpanded}
            >
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[10px] uppercase tracking-wider text-mushroom-400/90 font-semibold">
                  Ricerca live
                </p>
                <p className="text-sm font-bold text-forest-100 truncate">
                  {formatDateLabel(selectedDate)} · {formatHourRange(hourRange)}
                </p>
                <p className="text-[11px] text-forest-400 truncate">
                  {originName} · {rangeKm} km · {speciesLabel} · {visibleHotspots}{" "}
                  zone
                </p>
              </div>
              <span className="shrink-0 w-10 h-10 rounded-xl bg-forest-800 border border-forest-600/40 flex items-center justify-center text-forest-200">
                {mobileExpanded ? "▲" : "▼"}
              </span>
            </button>

            {!mobileExpanded && (
              <div className="flex gap-1.5 mt-1 overflow-x-auto scrollbar-none pb-1">
                {dayButtons(true)}
              </div>
            )}

            {mobileExpanded && (
              <div className="max-h-[46dvh] overflow-y-auto overscroll-contain space-y-4 pt-3 mt-2 border-t border-forest-700/40">
                <SearchSection title="📍 Partenza">
                  <button
                    type="button"
                    onClick={onOpenFilters}
                    className="w-full flex items-center justify-between gap-2 px-3 py-3 rounded-xl bg-forest-950 border border-forest-600/50 text-left touch-manipulation"
                  >
                    <span className="text-sm font-medium text-forest-100 truncate">
                      {originName}
                    </span>
                    <span className="text-xs text-mushroom-400 shrink-0">
                      Modifica →
                    </span>
                  </button>
                </SearchSection>

                <SearchSection title="📅 Giorno">
                  <div className="grid grid-cols-3 gap-1.5">
                    {dayButtons()}
                  </div>
                </SearchSection>

                <SearchSection title="⏰ Fascia oraria">
                  <div className="grid grid-cols-2 gap-1.5">
                    {HOUR_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyHourPreset(p.range)}
                        className={`px-3 py-2.5 rounded-xl text-left touch-manipulation ${
                          hourPresetMatches(hourRange, p.range)
                            ? "bg-mushroom-600 text-white"
                            : "bg-forest-800 text-forest-200"
                        }`}
                      >
                        <span className="text-sm">{p.icon}</span>{" "}
                        <span className="text-xs font-semibold">{p.label}</span>
                        <span className="block text-[10px] opacity-80 mt-0.5">
                          {formatHour(p.range.startHour)}–
                          {formatHour(p.range.endHour)}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomHours((v) => !v)}
                    className="text-[11px] text-mushroom-400 mt-2 touch-manipulation"
                  >
                    {customHours ? "Nascondi orari personalizzati" : "Orari personalizzati…"}
                  </button>
                  {customHours && (
                    <HourSelects
                      hourRange={hourRange}
                      onChange={applyHourPreset}
                    />
                  )}
                </SearchSection>

                <SearchSection title="🍄 Specie">
                  <div className="flex flex-wrap gap-1.5">
                    <SpeciesChip
                      active={species === "all"}
                      label="Tutte"
                      onClick={() => applySpecies("all")}
                    />
                    {SPECIES_LIST.map((sp) => (
                      <SpeciesChip
                        key={sp}
                        active={species === sp}
                        label={getSpeciesLabel(sp)}
                        color={SPECIES_COLORS[sp]}
                        onClick={() => applySpecies(sp)}
                      />
                    ))}
                  </div>
                </SearchSection>

                <SearchSection title="📏 Distanza">
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {RADIUS_QUICK_KM.map((km) => (
                      <button
                        key={km}
                        type="button"
                        onClick={() => onRangeChange(km)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation ${
                          rangeKm === km
                            ? "bg-mushroom-500 text-white"
                            : "bg-forest-800 text-forest-300"
                        }`}
                      >
                        {km} km
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onRangeChange(MAX_SEARCH_RADIUS_KM)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold touch-manipulation ${
                        rangeKm >= MAX_SEARCH_RADIUS_KM
                          ? "bg-mushroom-500 text-white"
                          : "bg-forest-800 text-forest-300"
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
                    value={rangeKm}
                    onChange={(e) => onRangeChange(Number(e.target.value))}
                    className={SLIDER_CLASS}
                  />
                  <p className="text-[10px] text-forest-500 mt-1">
                    {visibleZones}/{totalZones} zone nel raggio
                  </p>
                </SearchSection>

                <SearchSection title="🎯 Probabilità">
                  <div className="flex flex-wrap gap-1.5">
                    {PROBABILITY_FILTER_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => onProbabilityFilterChange(option.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold touch-manipulation ${
                          probabilityFilter === option.id
                            ? "bg-mushroom-500 text-white"
                            : "bg-forest-800 text-forest-300"
                        }`}
                      >
                        {option.id !== "all" && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        {option.shortLabel}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-forest-500 mt-1">
                    {visibleHotspots}/{totalHotspots} hotspot visibili
                  </p>
                </SearchSection>

                {onApplyPreset && (
                  <SearchSection title="⚡ Preset">
                    <div className="flex flex-wrap gap-1.5">
                      {FORAGING_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => onApplyPreset(preset)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-forest-800 text-forest-200 touch-manipulation"
                        >
                          {preset.icon} {preset.label}
                        </button>
                      ))}
                    </div>
                    {hasBestHotspot && onGoToBest && (
                      <button
                        type="button"
                        onClick={onGoToBest}
                        className="w-full mt-2 py-3 rounded-xl text-sm font-bold bg-mushroom-600 text-white touch-manipulation"
                      >
                        🎯 Migliore zona ({bestHotspotScore}%)
                      </button>
                    )}
                  </SearchSection>
                )}

                {onSearch && (
                  <button
                    type="button"
                    onClick={onSearch}
                    className="w-full py-3.5 rounded-xl bg-mushroom-500 text-white font-bold text-sm touch-manipulation shadow-lg"
                  >
                    Aggiorna meteo e zone
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ——— Desktop sidebar ——— */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-[320px] md:z-[1001] md:border-r md:border-forest-600/40 md:bg-forest-900/98 md:overflow-hidden md:pointer-events-auto">
        <div className="shrink-0 px-4 py-3 border-b border-forest-700/40 bg-forest-950/40">
          <h1 className="text-base font-bold text-forest-200 tracking-tight">
            🍄 Mushroom<span className="text-mushroom-400">Radar</span>
          </h1>
          <p className="text-[10px] text-forest-500 mt-0.5">
            Imposta ricerca · aggiornamento live
          </p>
        </div>

        {criteria && onCriteriaChange && onSearch && (
          <div className="p-4 border-b border-forest-700/40 shrink-0 max-h-[50vh] overflow-y-auto overscroll-contain">
            <AdvancedSearchForm
              criteria={criteria}
              onCriteriaChange={onCriteriaChange}
              onSearch={onSearch}
            />
            <div className="mt-3">
              <PremiumUpgradeBanner />
            </div>
          </div>
        )}

        <div className="px-4 py-4 space-y-4 flex-1 overflow-y-auto overscroll-contain min-h-0">
          <SeasonalSpeciesBanner />

          <SearchSection title="Fascia oraria rapida">
            <div className="flex flex-wrap gap-1.5">
              {HOUR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyHourPreset(p.range)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium touch-manipulation ${
                    hourPresetMatches(hourRange, p.range)
                      ? "bg-mushroom-500 text-white"
                      : "bg-forest-800 text-forest-300"
                  }`}
                >
                  {p.icon} {p.label}
                </button>
              ))}
            </div>
          </SearchSection>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Raggio · {rangeKm} km
            </p>
            <div className="flex flex-wrap gap-1 mb-2">
              {RADIUS_QUICK_KM.map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => onRangeChange(km)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-medium ${
                    rangeKm === km
                      ? "bg-mushroom-500 text-white"
                      : "bg-forest-800 text-forest-400"
                  }`}
                >
                  {km}
                </button>
              ))}
              <button
                type="button"
                onClick={() => onRangeChange(DEFAULT_SEARCH_RADIUS_KM)}
                className="px-2 py-1 rounded-lg text-[11px] bg-forest-800 text-forest-400"
              >
                Max
              </button>
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
            <p className="text-[10px] text-forest-500 mt-1">
              {visibleZones}/{totalZones} zone · {speciesLabel}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2">
              Probabilità · {visibleHotspots}/{totalHotspots}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROBABILITY_FILTER_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onProbabilityFilterChange(option.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                    probabilityFilter === option.id
                      ? "bg-mushroom-500 text-white"
                      : "bg-forest-800 text-forest-300"
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
          </div>

          {onApplyPreset && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-forest-400">
                Preset
              </p>
              <div className="flex flex-wrap gap-1">
                {FORAGING_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onApplyPreset(preset)}
                    className="px-2 py-1 rounded-lg text-[10px] bg-forest-800 text-forest-300"
                  >
                    {preset.icon} {preset.label}
                  </button>
                ))}
              </div>
              {hasBestHotspot && onGoToBest && (
                <button
                  type="button"
                  onClick={onGoToBest}
                  className="w-full py-2 rounded-lg text-xs font-semibold bg-mushroom-600 text-white"
                >
                  🎯 Migliore ({bestHotspotScore}%)
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function SearchSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-wider text-forest-400 font-semibold mb-2">
        {title}
      </h3>
      {children}
    </section>
  );
}

function HourSelects({
  hourRange,
  onChange,
}: {
  hourRange: HourRange;
  onChange: (range: HourRange) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 mt-2">
      <label className="block">
        <span className="text-[10px] text-forest-500">Dalle</span>
        <select
          value={hourRange.startHour}
          onChange={(e) => {
            const startHour = Number(e.target.value);
            onChange({
              startHour,
              endHour: Math.max(startHour, hourRange.endHour),
            });
          }}
          className="mt-1 w-full px-2 py-2.5 rounded-xl bg-forest-950 border border-forest-600/50 text-sm text-forest-100"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="text-[10px] text-forest-500">Alle</span>
        <select
          value={hourRange.endHour}
          onChange={(e) => {
            const endHour = Number(e.target.value);
            onChange({
              startHour: Math.min(hourRange.startHour, endHour),
              endHour,
            });
          }}
          className="mt-1 w-full px-2 py-2.5 rounded-xl bg-forest-950 border border-forest-600/50 text-sm text-forest-100"
        >
          {Array.from({ length: 24 }, (_, h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function SpeciesChip({
  active,
  label,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  color?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold touch-manipulation ${
        active ? "bg-mushroom-500 text-white" : "bg-forest-800 text-forest-200"
      }`}
    >
      {color && (
        <span
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}
