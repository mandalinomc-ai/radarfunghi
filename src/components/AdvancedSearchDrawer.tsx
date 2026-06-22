"use client";

import { useCallback, useState } from "react";
import type { FungalZone, MushroomSpecies } from "@/lib/types";
import type { GeoPoint } from "@/lib/geoUtils";
import {
  formatDateLabel,
  formatDateShort,
  maxSelectableDate,
  minSelectableDate,
  todayISO,
} from "@/lib/dateUtils";
import { formatHour, formatHourRange, type HourRange } from "@/lib/timeRange";
import { getSpeciesLabel, getSpeciesScientific } from "@/lib/predictionEngine";
import { SPECIES_COLORS } from "@/lib/mapUtils";
import { BENEVENTO } from "@/lib/benevento";
import { ALL_ZONE_REGIONS } from "@/lib/zoneFilters";
import { getRegionLabel } from "@/lib/regionLabels";
import OriginPicker from "./OriginPicker";

export interface SearchCriteria {
  origin: GeoPoint;
  selectedDate: string;
  hourRange: HourRange;
  species: MushroomSpecies | "all";
  includedRegions: FungalZone["region"][];
  minAltitude: number;
  maxAltitude: number;
  sortMode: "score" | "distance";
}

interface AdvancedSearchDrawerProps {
  criteria: SearchCriteria;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  onSearch: () => void;
  onDone?: () => void;
}

const SPECIES_LIST: MushroomSpecies[] = ["estatino", "galletto", "porcino"];

export function AdvancedSearchForm({
  criteria,
  onCriteriaChange,
  onSearch,
  onDone,
}: AdvancedSearchDrawerProps) {
  const update = useCallback(
    (partial: Partial<SearchCriteria>) => {
      onCriteriaChange({ ...criteria, ...partial });
    },
    [criteria, onCriteriaChange]
  );

  const toggleRegion = (region: FungalZone["region"]) => {
    const current = new Set(criteria.includedRegions);
    if (current.has(region)) current.delete(region);
    else current.add(region);
    update({ includedRegions: [...current] });
  };

  return (
    <div className="space-y-3">
      <OriginPicker
        origin={criteria.origin}
        onOriginChange={(origin) => update({ origin })}
        onSearch={onSearch}
      />

      <div>
        <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1">
          Quota bosco ({criteria.minAltitude}–{criteria.maxAltitude} m)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="range"
            min={400}
            max={1600}
            step={50}
            value={criteria.minAltitude}
            onChange={(e) =>
              update({
                minAltitude: Math.min(Number(e.target.value), criteria.maxAltitude - 50),
              })
            }
            className="w-full h-2 rounded-full appearance-none bg-forest-800 accent-mushroom-500"
          />
          <input
            type="range"
            min={500}
            max={1800}
            step={50}
            value={criteria.maxAltitude}
            onChange={(e) =>
              update({
                maxAltitude: Math.max(Number(e.target.value), criteria.minAltitude + 50),
              })
            }
            className="w-full h-2 rounded-full appearance-none bg-forest-800 accent-mushroom-500"
          />
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1">
          Ordina zone per
        </label>
        <div className="flex gap-2">
          {(
            [
              { id: "score", label: "Sprout Score" },
              { id: "distance", label: "Distanza" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => update({ sortMode: opt.id })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium touch-manipulation ${
                criteria.sortMode === opt.id
                  ? "bg-mushroom-500 text-white"
                  : "bg-forest-800 text-forest-400"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] uppercase tracking-wider text-forest-400">
            Regioni
          </label>
          <button
            type="button"
            onClick={() => update({ includedRegions: [...ALL_ZONE_REGIONS] })}
            className="text-[10px] text-mushroom-400 underline touch-manipulation"
          >
            Tutte
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_ZONE_REGIONS.map((region) => {
            const active = criteria.includedRegions.includes(region);
            return (
              <button
                key={region}
                type="button"
                onClick={() => toggleRegion(region)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation ${
                  active
                    ? "bg-mushroom-500 text-white"
                    : "bg-forest-800 text-forest-500 line-through"
                }`}
              >
                {getRegionLabel(region)}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1">
          Giorno
        </label>
        <input
          type="date"
          value={criteria.selectedDate}
          min={minSelectableDate()}
          max={maxSelectableDate()}
          onChange={(e) => update({ selectedDate: e.target.value })}
          className="w-full px-3 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-200"
        />
        <p className="text-[10px] text-mushroom-400/80 mt-1">
          {formatDateLabel(criteria.selectedDate)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1">
            Dalle
          </label>
          <select
            value={criteria.hourRange.startHour}
            onChange={(e) => {
              const startHour = Number(e.target.value);
              update({
                hourRange: {
                  startHour,
                  endHour: Math.max(startHour, criteria.hourRange.endHour),
                },
              });
            }}
            className="w-full px-2 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-200"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1">
            Alle
          </label>
          <select
            value={criteria.hourRange.endHour}
            onChange={(e) => {
              const endHour = Number(e.target.value);
              update({
                hourRange: {
                  startHour: Math.min(criteria.hourRange.startHour, endHour),
                  endHour,
                },
              });
            }}
            className="w-full px-2 py-2 rounded-lg bg-forest-950 border border-forest-700/50 text-sm text-forest-200"
          >
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {formatHour(h)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] uppercase tracking-wider text-forest-400 block mb-1.5">
          Specie
        </label>
        <div className="flex flex-wrap gap-1.5">
          <SpeciesChip
            active={criteria.species === "all"}
            label="Tutte"
            onClick={() => update({ species: "all" })}
          />
          {SPECIES_LIST.map((sp) => (
            <SpeciesChip
              key={sp}
              active={criteria.species === sp}
              label={getSpeciesLabel(sp)}
              color={SPECIES_COLORS[sp]}
              onClick={() => update({ species: sp })}
            />
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          onSearch();
          onDone?.();
        }}
        className="w-full py-2.5 rounded-xl bg-mushroom-500 text-white font-semibold text-sm touch-manipulation"
      >
        Cerca zone
      </button>
    </div>
  );
}

export default function AdvancedSearchDrawer({
  criteria,
  onCriteriaChange,
  onSearch,
}: Omit<AdvancedSearchDrawerProps, "onDone">) {
  const [open, setOpen] = useState(false);

  const speciesLabel =
    criteria.species === "all"
      ? "Tutte"
      : getSpeciesLabel(criteria.species);

  const activeRegions =
    criteria.includedRegions.length === ALL_ZONE_REGIONS.length
      ? "tutte"
      : `${criteria.includedRegions.length} reg.`;

  return (
    <div className="hidden md:block absolute top-[96px] left-4 w-[420px] z-[1001] pointer-events-auto">
      <div className="bg-forest-900/95 backdrop-blur-md border border-forest-600/40 rounded-xl shadow-2xl overflow-hidden">
        <button
          onClick={() => setOpen(!open)}
          className="w-full px-4 py-3 flex items-center justify-between gap-2 hover:bg-forest-800/40 touch-manipulation"
        >
          <div className="min-w-0 text-left">
            <p className="text-[10px] uppercase tracking-wider text-mushroom-400 font-semibold">
              Ricerca avanzata
            </p>
            <p className="text-sm text-forest-200 truncate">
              {criteria.origin.name} · {formatDateShort(criteria.selectedDate)} ·{" "}
              {formatHourRange(criteria.hourRange)} · {speciesLabel} · {activeRegions}
            </p>
          </div>
          <span className="text-forest-400 shrink-0">{open ? "▲" : "▼"}</span>
        </button>
        {open && (
          <div className="border-t border-forest-700/40 px-4 py-4">
            <AdvancedSearchForm
              criteria={criteria}
              onCriteriaChange={onCriteriaChange}
              onSearch={onSearch}
              onDone={() => setOpen(false)}
            />
          </div>
        )}
      </div>
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
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium touch-manipulation ${
        active ? "bg-mushroom-500 text-white" : "bg-forest-800 text-forest-300"
      }`}
    >
      {color && (
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {label}
    </button>
  );
}

export function createDefaultSearchCriteria(): SearchCriteria {
  return {
    origin: {
      name: BENEVENTO.name,
      lat: BENEVENTO.lat,
      lng: BENEVENTO.lng,
      source: "benevento",
    },
    selectedDate: todayISO(),
    hourRange: { startHour: 6, endHour: 10 },
    species: "all",
    includedRegions: [...ALL_ZONE_REGIONS],
    minAltitude: 400,
    maxAltitude: 1800,
    sortMode: "score",
  };
}
