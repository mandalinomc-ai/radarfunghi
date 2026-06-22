"use client";

import type { FungalZone } from "@/lib/types";
import {
  analyzeSoilFruiting,
  getDevelopmentStageLabel,
  getWetnessLabel,
  type GrowthHealth,
} from "@/lib/soilFruitingModel";

interface SoilFruitingSectionProps {
  zone: FungalZone;
  selectedDate: string;
  compact?: boolean;
}

const HEALTH_COLORS: Record<GrowthHealth, string> = {
  critico: "text-red-300",
  scarso: "text-orange-300",
  discreto: "text-amber-200",
  buono: "text-green-300",
  ottimo: "text-emerald-200",
};

const RETENTION_LABELS = {
  clay: "Suolo argilloso (ritiene umidità)",
  mixed: "Suolo misto",
  calcareous: "Suolo calcareo (drenaggio rapido)",
} as const;

export default function SoilFruitingSection({
  zone,
  selectedDate,
  compact,
}: SoilFruitingSectionProps) {
  const analysis = analyzeSoilFruiting(zone, selectedDate);

  return (
    <div
      className={`rounded-xl border border-teal-500/25 bg-teal-950/25 ${
        compact ? "p-2.5" : "p-3"
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-teal-300/90 font-medium mb-2">
        Umidità suolo &amp; timing frutti
      </p>

      <div className="flex items-center gap-3 mb-2">
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: `conic-gradient(#2dd4bf ${analysis.effectiveMoisturePct}%, #1e3a2f 0)`,
          }}
        >
          <span className="w-9 h-9 rounded-full bg-forest-950 flex items-center justify-center text-xs font-bold text-teal-200">
            {analysis.effectiveMoisturePct}%
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-teal-100">
            {getWetnessLabel(analysis.wetnessStatus)}
          </p>
          <p className="text-[10px] text-forest-400 leading-relaxed">
            {RETENTION_LABELS[analysis.retentionClass]}
            {analysis.lastRainEventDate
              ? ` · Pioggia utile ${analysis.lastRainEventMm} mm (${analysis.daysSinceLastRainEvent ?? 0} gg fa)`
              : " · Nessuna pioggia utile recente"}
          </p>
        </div>
      </div>

      <p className="text-[11px] text-forest-300 leading-relaxed mb-2">
        {analysis.summary}
      </p>

      <div className="space-y-2">
        {analysis.speciesEstimates.map((est) => (
          <div
            key={est.species}
            className="rounded-lg bg-forest-950/50 px-2.5 py-2 border border-forest-700/40"
          >
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] font-semibold text-mushroom-300">
                {est.label}
              </p>
              <span
                className={`text-[10px] font-medium ${HEALTH_COLORS[est.growthHealth]}`}
              >
                Salute {est.growthHealth} ({est.growthHealthScore}%)
              </span>
            </div>
            <p className="text-[10px] text-forest-400">
              {getDevelopmentStageLabel(est.developmentStage)}
              {est.daysUntilWindowStart >= 0 &&
                est.developmentStage !== "finestra_attiva" &&
                est.developmentStage !== "declino" &&
                ` · tra ${est.daysUntilWindowStart}–${Math.max(est.daysUntilWindowPeak, est.daysUntilWindowStart)} gg`}
            </p>
            <p className="text-[10px] text-forest-500 mt-0.5 leading-relaxed">
              {est.explanation}
            </p>
          </div>
        ))}
      </div>

      <p className="text-[9px] text-forest-600 mt-2 leading-relaxed">
        Modello: piogge 14g + umidità Open-Meteo + ritenzione suolo (FM lag 5–16 gg per specie).
      </p>
    </div>
  );
}
