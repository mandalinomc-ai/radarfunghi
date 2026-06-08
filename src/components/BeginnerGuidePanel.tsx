"use client";

import type { BeginnerRoadmap } from "@/lib/beginnerGuide";
import {
  FM_TRAFFIC_LIGHT_COLORS,
  FM_TRAFFIC_LIGHT_LABELS,
} from "@/lib/funghimagazineData";
import { getSpeciesGuideText } from "@/lib/beginnerGuide";
import type { MushroomSpecies } from "@/lib/types";

interface BeginnerGuidePanelProps {
  roadmap: BeginnerRoadmap | null;
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  hasDetailOpen?: boolean;
}

export default function BeginnerGuidePanel({
  roadmap,
  isOpen,
  onClose,
  onGenerate,
  isLoading,
  hasDetailOpen,
}: BeginnerGuidePanelProps) {
  if (!isOpen && !isLoading && !hasDetailOpen) {
    return (
      <button
        onClick={onGenerate}
        disabled={isLoading}
        className="absolute bottom-[200px] md:bottom-[140px] left-3 right-3 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[1001] pointer-events-auto
          px-4 py-3.5 md:px-8 md:py-4 rounded-2xl
          bg-gradient-to-r from-mushroom-500 via-mushroom-400 to-mushroom-500
          hover:from-mushroom-400 hover:via-mushroom-300 hover:to-mushroom-400
          text-white font-bold text-sm md:text-base tracking-wide text-center
          shadow-[0_0_30px_rgba(228,120,48,0.4)]
          border-2 border-mushroom-300/50
          transition-all transform active:scale-95
          disabled:opacity-60 disabled:cursor-wait
          animate-pulse md:hover:animate-none touch-manipulation"
      >
        {isLoading ? (
          "⏳ Preparo la guida..."
        ) : (
          "🍄 NON SO NIENTE — DIMMI TUTTO!"
        )}
      </button>
    );
  }

  if (isLoading || (!roadmap && isOpen)) {
    return (
      <div className="absolute inset-0 z-[1002] pointer-events-auto flex items-center justify-center bg-forest-950/80 backdrop-blur-sm">
        <div className="bg-forest-900 border border-forest-600 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-12 h-12 border-3 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-forest-300">Sto analizzando meteo, zone e dati Funghimagazine...</p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="absolute inset-0 z-[1002] pointer-events-auto flex items-center justify-center bg-forest-950/80 backdrop-blur-sm">
        <div className="bg-forest-900 border border-forest-600 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <p className="text-4xl mb-4">😔</p>
          <h2 className="text-xl font-bold text-forest-200 mb-2">
            Nessuna zona consigliata
          </h2>
          <p className="text-sm text-forest-400 mb-6">
            Per il giorno e l&apos;ora selezionati non ci sono zone con
            probabilità sufficiente. Prova &quot;Domani alle 06:00&quot; o
            attendi il 10-12 giugno per i Porcini (dice Funghimagazine).
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-forest-700 text-forest-200 hover:bg-forest-600"
          >
            Chiudi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[1004] pointer-events-auto flex items-end md:items-center justify-center bg-forest-950/70 backdrop-blur-sm p-0 md:p-4 safe-top">
      <div className="bg-forest-900 border border-mushroom-500/30 rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[92dvh] md:max-h-[85vh] overflow-y-auto shadow-2xl safe-bottom">
        <div className="sticky top-0 bg-forest-900/95 backdrop-blur-lg border-b border-forest-700/40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mushroom-400">
              Guida per principianti
            </p>
            <h2 className="text-xl font-bold text-forest-100">
              La tua spedizione fungina
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-300 flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        <div className="p-4 md:p-6 space-y-4 md:space-y-5 pb-6">
          <div className="bg-gradient-to-r from-mushroom-500/20 to-forest-600/20 rounded-xl p-4 border border-mushroom-500/20">
            <p className="text-lg font-semibold text-forest-100 leading-relaxed">
              {roadmap.simpleVerdict}
            </p>
            <div className="flex items-center gap-3 mt-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                style={{
                  backgroundColor: `${FM_TRAFFIC_LIGHT_COLORS[roadmap.trafficLight]}33`,
                  color: FM_TRAFFIC_LIGHT_COLORS[roadmap.trafficLight],
                }}
              >
                {FM_TRAFFIC_LIGHT_LABELS[roadmap.trafficLight]}
              </span>
              <span className="text-sm text-mushroom-400 font-bold">
                Score {roadmap.score}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3">
            <InfoCard label="Dove andare" value={roadmap.recommendedZone} />
            <InfoCard
              label="Quanto puoi trovare"
              value={roadmap.totalExpected}
              highlight
            />
            <InfoCard label="Parti alle" value={roadmap.departureTime} />
            <InfoCard label="Arriva alle" value={roadmap.arrivalTime} />
            <InfoCard label="Finestra raccolta" value={roadmap.collectionWindow} />
            <InfoCard label="Quota" value={`${roadmap.altitude} m`} />
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
              Stima quantità per specie
            </p>
            <div className="space-y-2">
              {roadmap.yields.map((y) => (
                <div
                  key={y.species}
                  className="bg-forest-950/60 rounded-lg p-3 border border-forest-700/30"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-forest-200">
                      {y.label}
                    </span>
                    <span className="text-sm font-bold text-mushroom-400">
                      {y.min === 0 ? "0" : y.min}-{y.max} {y.unit}
                    </span>
                  </div>
                  <p className="text-[10px] text-forest-500 mt-1">
                    Affidabilità: {y.confidence} — {y.note}
                  </p>
                  <p className="text-[10px] text-forest-400 mt-1 italic">
                    {getSpeciesGuideText(y.species as MushroomSpecies)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-3">
              Roadmap passo-passo
            </p>
            <div className="space-y-0">
              {roadmap.roadmap.map((step, i) => (
                <div key={step.step} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-forest-700 flex items-center justify-center text-lg shrink-0">
                      {step.icon}
                    </div>
                    {i < roadmap.roadmap.length - 1 && (
                      <div className="w-0.5 flex-1 bg-forest-700 my-1 min-h-[24px]" />
                    )}
                  </div>
                  <div className="pb-4 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-mushroom-400">
                        {step.time}
                      </span>
                      <span className="text-sm font-semibold text-forest-200">
                        {step.title}
                      </span>
                    </div>
                    <p className="text-xs text-forest-400 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider text-forest-500 mb-2">
              Cosa portare
            </p>
            <ul className="grid grid-cols-2 gap-1">
              {roadmap.equipment.map((item) => (
                <li
                  key={item}
                  className="text-xs text-forest-300 flex items-center gap-1.5"
                >
                  <span className="text-mushroom-400">✓</span> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-red-950/30 border border-red-800/30 rounded-xl p-4">
            <p className="text-[10px] uppercase tracking-wider text-red-400 mb-2">
              Attenzione
            </p>
            <ul className="space-y-1">
              {roadmap.warnings.map((w, i) => (
                <li key={i} className="text-xs text-red-300/90">
                  ⚠️ {w}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-forest-950/40 rounded-lg p-3 border border-forest-700/20">
            <p className="text-[10px] text-forest-500">
              Dati meteo e nascite da{" "}
              <a
                href={roadmap.fmSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-mushroom-400 underline"
              >
                {roadmap.fmSource}
              </a>{" "}
              — {roadmap.weatherNote}
            </p>
          </div>

          <a
            href={roadmap.mapsLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-4 rounded-xl bg-gradient-to-r from-mushroom-500 to-mushroom-600 hover:from-mushroom-400 hover:to-mushroom-500 text-white text-center font-bold text-sm tracking-wide shadow-lg transition-all"
          >
            🧭 APRI NAVIGATORE — VAI AL PARCHEGGIO
          </a>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-forest-950/60 rounded-lg p-3 border border-forest-700/30">
      <p className="text-[10px] uppercase tracking-wider text-forest-500">
        {label}
      </p>
      <p
        className={`text-sm font-semibold mt-0.5 ${
          highlight ? "text-mushroom-400" : "text-forest-200"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
