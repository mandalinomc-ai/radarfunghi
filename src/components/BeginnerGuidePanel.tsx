"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BeginnerRoadmap } from "@/lib/beginnerGuide";
import {
  FM_TRAFFIC_LIGHT_COLORS,
  FM_TRAFFIC_LIGHT_LABELS,
} from "@/lib/funghimagazineData";
import { getSpeciesGuideText } from "@/lib/beginnerGuide";
import { formatDateLabel, todayISO } from "@/lib/dateUtils";
import type { MushroomSpecies } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";

const ALL_SPECIES: MushroomSpecies[] = ["porcino", "estatino", "galletto"];

interface BeginnerGuidePanelProps {
  roadmap: BeginnerRoadmap | null;
  isOpen: boolean;
  parked: boolean;
  onClose: () => void;
  onPark: () => void;
  onUnpark: () => void;
  onGenerate: (species: MushroomSpecies[]) => void;
  isLoading: boolean;
  hasDetailOpen?: boolean;
  originReady?: boolean;
  selectedDate?: string;
  className?: string;
  openTrigger?: number;
}

function EmptyGuideMessage({
  selectedDate,
  onClose,
  onPark,
}: {
  selectedDate: string;
  onClose: () => void;
  onPark: () => void;
}) {
  const dayLabel = formatDateLabel(selectedDate);
  return (
    <div
      className="fixed inset-0 z-[1004] pointer-events-auto flex items-center justify-center bg-forest-950/80 backdrop-blur-sm p-4"
      onClick={onPark}
    >
      <div
        className="bg-forest-900 border border-forest-600 rounded-2xl p-6 md:p-8 max-w-md w-full text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-4xl mb-4">😔</p>
        <h2 className="text-xl font-bold text-forest-200 mb-2">
          Nessuna zona consigliata
        </h2>
        <p className="text-sm text-forest-400 mb-6 leading-relaxed">
          Per <strong className="text-forest-300">{dayLabel}</strong> non ci sono
          zone con probabilità sufficiente per le specie scelte. Prova ad
          allargare il raggio, cambiare giorno/orario o selezionare altre
          specie.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-forest-800 text-forest-300 font-semibold touch-manipulation"
          >
            Riprova
          </button>
          <button
            type="button"
            onClick={onPark}
            className="flex-1 px-4 py-3 rounded-xl bg-mushroom-500 text-white font-semibold touch-manipulation"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
}

function SpeciesPicker({
  selected,
  onToggle,
  onConfirm,
  onPark,
}: {
  selected: MushroomSpecies[];
  onToggle: (s: MushroomSpecies) => void;
  onConfirm: () => void;
  onPark: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1004] pointer-events-auto flex items-end md:items-center justify-center bg-forest-950/75 backdrop-blur-sm p-0 md:p-4"
      onClick={onPark}
    >
      <div
        className="bg-forest-900 border border-mushroom-500/30 rounded-t-2xl md:rounded-2xl w-full max-w-md shadow-2xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-forest-700/40 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mushroom-400">
              Passo 1
            </p>
            <h2 className="text-lg font-bold text-forest-100">
              Che funghi cerchi?
            </h2>
          </div>
          <button
            type="button"
            onClick={onPark}
            className="w-9 h-9 rounded-lg bg-forest-800 text-forest-400 touch-manipulation"
            title="Parcheggia guida"
          >
            −
          </button>
        </div>
        <div className="p-5 space-y-3">
          <p className="text-xs text-forest-400 leading-relaxed">
            Seleziona una o più specie. Poi ti dirò dove andare, quando partire
            e cosa aspettarti.
          </p>
          {ALL_SPECIES.map((sp) => {
            const active = selected.includes(sp);
            return (
              <button
                key={sp}
                type="button"
                onClick={() => onToggle(sp)}
                className={`w-full text-left px-4 py-3 rounded-xl border touch-manipulation transition-colors ${
                  active
                    ? "border-mushroom-500/60 bg-mushroom-500/15 text-mushroom-100"
                    : "border-forest-700/50 bg-forest-950/50 text-forest-300"
                }`}
              >
                <span className="font-semibold text-sm">
                  {active ? "✓ " : ""}
                  {getSpeciesLabel(sp)}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={onConfirm}
            disabled={selected.length === 0}
            className="w-full py-3.5 rounded-xl bg-mushroom-500 hover:bg-mushroom-400 disabled:opacity-40 text-white font-bold text-sm touch-manipulation mt-2"
          >
            Dimmi tutto
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BeginnerGuidePanel({
  roadmap,
  isOpen,
  parked,
  onClose,
  onPark,
  onUnpark,
  onGenerate,
  isLoading,
  hasDetailOpen,
  originReady = true,
  selectedDate = todayISO(),
  className = "bottom-[278px] md:bottom-[255px]",
  openTrigger = 0,
}: BeginnerGuidePanelProps) {
  const [species, setSpecies] = useState<MushroomSpecies[]>(["porcino"]);
  const [showSpecies, setShowSpecies] = useState(false);

  useEffect(() => {
    if (openTrigger > 0) {
      setShowSpecies(true);
    }
  }, [openTrigger]);

  const openGuide = () => {
    onUnpark();
    setShowSpecies(true);
  };

  const toggleSpecies = (sp: MushroomSpecies) => {
    setSpecies((prev) =>
      prev.includes(sp) ? prev.filter((s) => s !== sp) : [...prev, sp]
    );
  };

  const handleConfirmSpecies = () => {
    if (species.length === 0) return;
    setShowSpecies(false);
    onGenerate(species);
  };

  const handlePark = () => {
    setShowSpecies(false);
    onPark();
  };

  if (!isOpen && !isLoading && !showSpecies && originReady) {
    if (parked || hasDetailOpen) {
      return (
        <button
          type="button"
          onClick={openGuide}
          disabled={isLoading}
          className={`fixed ${className.replace("absolute", "")} left-3 z-[1001] pointer-events-auto w-12 h-12 rounded-full bg-mushroom-600/90 hover:bg-mushroom-500 text-white text-xl shadow-lg border border-mushroom-400/40 touch-manipulation flex items-center justify-center`}
          title="Guida principianti — non so niente"
        >
          🍄
        </button>
      );
    }
    return (
      <button
        type="button"
        onClick={openGuide}
        disabled={isLoading}
        className={`md:hidden absolute ${className} left-1/2 -translate-x-1/2 z-[1001] pointer-events-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-mushroom-500 to-mushroom-400 text-white font-bold text-sm tracking-wide text-center shadow-lg border border-mushroom-300/40 touch-manipulation max-w-[calc(100%-1.5rem)]`}
      >
        🍄 Non so niente — che fungo cerco?
      </button>
    );
  }

  if (!isOpen && !showSpecies) {
    if (!parked && originReady && !hasDetailOpen) {
      return (
        <button
          type="button"
          onClick={openGuide}
          className="hidden md:flex fixed bottom-6 left-6 z-[1001] w-12 h-12 rounded-full bg-mushroom-600/90 hover:bg-mushroom-500 text-white text-xl shadow-lg border border-mushroom-400/40 items-center justify-center touch-manipulation"
          title="Guida principianti"
        >
          🍄
        </button>
      );
    }
    return null;
  }

  if (showSpecies && !isLoading) {
    return (
      <SpeciesPicker
        selected={species}
        onToggle={toggleSpecies}
        onConfirm={handleConfirmSpecies}
        onPark={handlePark}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[1004] pointer-events-auto flex items-center justify-center bg-forest-950/80 backdrop-blur-sm">
        <div className="bg-forest-900 border border-forest-600 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="w-12 h-12 border-3 border-mushroom-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-forest-300">
            Sto analizzando meteo, zone e le specie che hai scelto...
          </p>
        </div>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <EmptyGuideMessage
        selectedDate={selectedDate}
        onClose={() => {
          setShowSpecies(true);
          onClose();
        }}
        onPark={handlePark}
      />
    );
  }

  return (
    <div
      className="fixed inset-0 z-[1004] pointer-events-auto flex items-end md:items-center justify-center bg-forest-950/70 backdrop-blur-sm p-0 md:p-4 safe-top"
      onClick={handlePark}
    >
      <div
        className="bg-forest-900 border border-mushroom-500/30 rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[92dvh] md:max-h-[85vh] overflow-y-auto shadow-2xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-forest-900/95 backdrop-blur-lg border-b border-forest-700/40 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-mushroom-400">
              Guida per principianti
            </p>
            <h2 className="text-xl font-bold text-forest-100">
              La tua spedizione fungina
            </h2>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handlePark}
              className="w-9 h-9 rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-400 flex items-center justify-center touch-manipulation text-sm"
              title="Parcheggia (icona 🍄)"
            >
              −
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-forest-800 hover:bg-forest-700 text-forest-300 flex items-center justify-center touch-manipulation"
            >
              ✕
            </button>
          </div>
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
