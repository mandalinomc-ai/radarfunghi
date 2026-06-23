"use client";

import type { MapHotspot } from "@/lib/types";
import type { SearchCriteria } from "@/components/AdvancedSearchDrawer";
import {
  buildZoneScoreBreakdown,
  formatBreakdownTitle,
} from "@/lib/sproutScoreBreakdown";
import { getSpeciesLabel } from "@/lib/predictionEngine";

interface ResultsExplanationPanelProps {
  hotspots: MapHotspot[];
  criteria: SearchCriteria;
}

export default function ResultsExplanationPanel({
  hotspots,
  criteria,
}: ResultsExplanationPanelProps) {
  if (hotspots.length === 0) {
    return (
      <div className="enterprise-panel rounded-2xl p-6 text-center text-sage-400 text-sm">
        Nessuna zona corrisponde ai filtri attuali. Prova ad ampliare raggio o
        abbassare la soglia probabilità.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-sage-100">
          Scomposizione Sprout Score
        </h2>
        <p className="text-xs text-sage-400 mt-1">
          Modificatori attivi: GDD suolo, vento/evapotraspirazione, larve,
          fruiting shock, malluvione
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {hotspots.map((h) => {
          const breakdown = buildZoneScoreBreakdown(
            h.zone,
            h.activeSpecies,
            criteria.hourRange,
            criteria.selectedDate
          );
          return (
            <article
              key={h.zone.id}
              className="enterprise-panel rounded-2xl p-4 border border-enterprise-border/50"
            >
              <header className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="text-sm font-semibold text-sage-100">
                    {formatBreakdownTitle(h.zone.name, h.activeSpecies)}
                  </p>
                  <p className="text-[11px] text-sage-500">
                    {h.zone.altitude} m · {h.zone.region}
                  </p>
                </div>
                <span className="text-xl font-bold text-neon tabular-nums">
                  {breakdown.score}%
                </span>
              </header>

              <div className="grid grid-cols-3 gap-2 mb-3 text-[10px]">
                {Object.entries(breakdown.factors).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg bg-enterprise-bg/60 px-2 py-1.5 border border-enterprise-border/30"
                  >
                    <p className="text-sage-500 uppercase tracking-wide truncate">
                      {k.replace("Score", "")}
                    </p>
                    <p className="text-sage-200 font-semibold">{v}</p>
                  </div>
                ))}
              </div>

              {breakdown.modifiers.length > 0 ? (
                <ul className="space-y-2">
                  {breakdown.modifiers.map((m) => (
                    <li
                      key={m.id}
                      className={`rounded-lg px-3 py-2 text-xs border ${
                        m.impact === "bonus"
                          ? "border-neon/30 bg-neon/5 text-neon"
                          : m.impact === "malus"
                            ? "border-red-500/30 bg-red-950/20 text-red-200"
                            : "border-sage-600/30 text-sage-300"
                      }`}
                    >
                      <p className="font-semibold">{m.label}</p>
                      <p className="opacity-80 mt-0.5">{m.detail}</p>
                      <p className="text-[10px] mt-1 opacity-70">
                        ×{m.multiplier.toFixed(2)}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-sage-500">
                  Nessun malus/bonus extra oltre i fattori base.
                </p>
              )}

              <p className="text-[10px] text-sage-600 mt-3">
                Specie attiva: {getSpeciesLabel(h.activeSpecies)}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
