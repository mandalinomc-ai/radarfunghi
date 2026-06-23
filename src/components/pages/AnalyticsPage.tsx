"use client";

import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip,
} from "chart.js";
import { useRadarSearch } from "@/context/RadarSearchContext";
import type { FungalZone, MushroomSpecies } from "@/lib/types";
import {
  buildRegionComparisonSeries,
  buildSpeciesComparisonSeries,
  datasetsToChartJs,
} from "@/lib/analyticsSeries";
import { ALL_ZONE_REGIONS } from "@/lib/zoneFilters";
import { getRegionLabel } from "@/lib/regionLabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Legend,
  Tooltip
);

const SPECIES: MushroomSpecies[] = ["porcino", "estatino", "galletto"];
const YEARS = [2024, 2025, 2026];

export default function AnalyticsPage() {
  const radar = useRadarSearch();
  const [mode, setMode] = useState<"species" | "region">("species");
  const [selectedSpecies, setSelectedSpecies] = useState<MushroomSpecies[]>([
    "porcino",
    "estatino",
  ]);
  const [selectedRegions, setSelectedRegions] = useState<
    FungalZone["region"][]
  >(["matese", "taburno"]);
  const [compareSpecies, setCompareSpecies] =
    useState<MushroomSpecies>("porcino");
  const [selectedYears, setSelectedYears] = useState<number[]>([2025, 2026]);
  const [monthStart, setMonthStart] = useState(9);
  const [dayStart, setDayStart] = useState(1);
  const [monthEnd, setMonthEnd] = useState(10);
  const [dayEnd, setDayEnd] = useState(31);

  const chartData = useMemo(() => {
    const datasets =
      mode === "species"
        ? buildSpeciesComparisonSeries(
            radar.liveZones,
            selectedSpecies,
            selectedYears,
            monthStart,
            dayStart,
            monthEnd,
            dayEnd,
            radar.criteria.hourRange
          )
        : buildRegionComparisonSeries(
            radar.liveZones,
            selectedRegions,
            compareSpecies,
            selectedYears,
            monthStart,
            dayStart,
            monthEnd,
            dayEnd,
            radar.criteria.hourRange
          );
    return datasetsToChartJs(datasets);
  }, [
    mode,
    radar.liveZones,
    radar.criteria.hourRange,
    selectedSpecies,
    selectedRegions,
    compareSpecies,
    selectedYears,
    monthStart,
    dayStart,
    monthEnd,
    dayEnd,
  ]);

  const toggleSpecies = (s: MushroomSpecies) => {
    setSelectedSpecies((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const toggleRegion = (r: FungalZone["region"]) => {
    setSelectedRegions((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

  const toggleYear = (y: number) => {
    setSelectedYears((prev) =>
      prev.includes(y) ? prev.filter((x) => x !== y) : [...prev, y]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-24">
      <div>
        <h1 className="font-display text-2xl text-sage-100">
          Analytics Comparativo
        </h1>
        <p className="text-sm text-sage-400 mt-1">
          Confronto multi-variabile · overlay multi-anno · range date custom
        </p>
      </div>

      <div className="flex gap-2">
        {(["species", "region"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              mode === m
                ? "bg-neon/15 text-neon border border-neon/35"
                : "text-sage-400 border border-enterprise-border/40"
            }`}
          >
            {m === "species" ? "Specie" : "Macro-aree"}
          </button>
        ))}
      </div>

      <div className="enterprise-panel rounded-2xl p-4 grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase text-sage-500 mb-2">Anni</p>
          <div className="flex flex-wrap gap-2">
            {YEARS.map((y) => (
              <label key={y} className="flex items-center gap-1.5 text-xs text-sage-300">
                <input
                  type="checkbox"
                  checked={selectedYears.includes(y)}
                  onChange={() => toggleYear(y)}
                />
                {y}
              </label>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <label className="text-sage-400">
            Da (m/g)
            <div className="flex gap-1 mt-1">
              <input
                type="number"
                min={1}
                max={12}
                value={monthStart}
                onChange={(e) => setMonthStart(Number(e.target.value))}
                className="w-14 enterprise-input rounded px-2 py-1"
              />
              <input
                type="number"
                min={1}
                max={31}
                value={dayStart}
                onChange={(e) => setDayStart(Number(e.target.value))}
                className="w-14 enterprise-input rounded px-2 py-1"
              />
            </div>
          </label>
          <label className="text-sage-400">
            A (m/g)
            <div className="flex gap-1 mt-1">
              <input
                type="number"
                min={1}
                max={12}
                value={monthEnd}
                onChange={(e) => setMonthEnd(Number(e.target.value))}
                className="w-14 enterprise-input rounded px-2 py-1"
              />
              <input
                type="number"
                min={1}
                max={31}
                value={dayEnd}
                onChange={(e) => setDayEnd(Number(e.target.value))}
                className="w-14 enterprise-input rounded px-2 py-1"
              />
            </div>
          </label>
        </div>
      </div>

      {mode === "species" ? (
        <div className="flex flex-wrap gap-3">
          {SPECIES.map((s) => (
            <label
              key={s}
              className="flex items-center gap-2 text-sm text-sage-300 enterprise-panel px-3 py-2 rounded-xl"
            >
              <input
                type="checkbox"
                checked={selectedSpecies.includes(s)}
                onChange={() => toggleSpecies(s)}
              />
              {s}
            </label>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-3">
            {ALL_ZONE_REGIONS.map((r) => (
              <label
                key={r}
                className="flex items-center gap-2 text-sm text-sage-300 enterprise-panel px-3 py-2 rounded-xl"
              >
                <input
                  type="checkbox"
                  checked={selectedRegions.includes(r)}
                  onChange={() => toggleRegion(r)}
                />
                {getRegionLabel(r)}
              </label>
            ))}
          </div>
          <select
            value={compareSpecies}
            onChange={(e) =>
              setCompareSpecies(e.target.value as MushroomSpecies)
            }
            className="enterprise-input rounded-lg px-3 py-2 text-sm"
          >
            {SPECIES.map((s) => (
              <option key={s} value={s}>
                Specie: {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="enterprise-panel rounded-2xl p-4 h-[420px]">
        <Line
          data={chartData}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { labels: { color: "#9cb89a" } },
            },
            scales: {
              x: { ticks: { color: "#6b8069", maxTicksLimit: 12 } },
              y: {
                min: 0,
                max: 100,
                ticks: { color: "#6b8069" },
                grid: { color: "rgba(0,255,102,0.06)" },
              },
            },
          }}
        />
      </div>
    </div>
  );
}
