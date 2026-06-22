"use client";

import { useEffect, useState } from "react";
import {
  buildGuideChatPrompt,
  type BeginnerGuideResult,
  type BeginnerSpeciesPlan,
} from "@/lib/beginnerGuide";
import { FM_TRAFFIC_LIGHT_COLORS } from "@/lib/funghimagazineData";
import { formatDateLabel, todayISO } from "@/lib/dateUtils";
import type { MushroomSpecies } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";
import BeginnerGuideBanner from "./BeginnerGuideBanner";

const ALL_SPECIES: MushroomSpecies[] = ["porcino", "estatino", "galletto"];

const SPECIES_EMOJI: Record<MushroomSpecies, string> = {
  porcino: "🟤",
  estatino: "🟡",
  galletto: "🟠",
};

interface BeginnerGuidePanelProps {
  guideResult: BeginnerGuideResult | null;
  isOpen: boolean;
  parked: boolean;
  onClose: () => void;
  onPark: () => void;
  onUnpark: () => void;
  onGenerate: (species: MushroomSpecies[]) => void;
  onOpenChat: (initialMessage?: string) => void;
  isLoading: boolean;
  hasDetailOpen?: boolean;
  originReady?: boolean;
  selectedDate?: string;
  className?: string;
  openTrigger?: number;
}

function GuideChatCta({
  title,
  subtitle,
  onChat,
  compact,
}: {
  title: string;
  subtitle: string;
  onChat: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`guide-chat-cta rounded-2xl ${compact ? "p-3" : "p-4 md:p-5"} transition-colors`}
    >
      <div className={`flex ${compact ? "flex-col gap-2" : "flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"}`}>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/90 font-semibold mb-1">
            Mastro Fungaiolo AI
          </p>
          <p className={`font-display text-forest-100 leading-snug ${compact ? "text-base" : "text-lg md:text-xl"}`}>
            {title}
          </p>
          <p className="text-xs text-forest-400 mt-1 leading-relaxed">{subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onChat}
          className={`guide-chat-btn shrink-0 inline-flex items-center justify-center gap-2 rounded-xl text-white font-bold touch-manipulation transition-all ${
            compact ? "w-full py-2.5 text-sm" : "px-5 py-3.5 text-sm"
          }`}
        >
          <span className="text-lg" aria-hidden>
            💬
          </span>
          Chatta col bot
        </button>
      </div>
    </div>
  );
}

function PanelChrome({
  eyebrow,
  title,
  subtitle,
  onPark,
  onClose,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onPark: () => void;
  onClose?: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[1004] pointer-events-auto flex items-end md:items-center justify-center guide-shell-overlay p-0 md:p-6 safe-top"
      onClick={onPark}
    >
      <div
        className="guide-panel rounded-t-3xl md:rounded-3xl w-full max-w-3xl max-h-[94dvh] md:max-h-[88vh] overflow-hidden flex flex-col shadow-2xl safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="guide-panel-header shrink-0 px-5 md:px-8 py-4 md:py-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-mushroom-400/90 font-semibold">
              {eyebrow}
            </p>
            <h2 className="font-display text-2xl md:text-3xl text-forest-100 mt-1 leading-tight">
              {title}
            </h2>
            {subtitle && (
              <p className="text-xs text-forest-500 mt-1.5 max-w-md leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onPark}
              className="w-9 h-9 rounded-xl bg-forest-950/60 border border-forest-700/40 text-forest-400 flex items-center justify-center touch-manipulation hover:bg-forest-800/60"
              title="Minimizza"
            >
              −
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-forest-950/60 border border-forest-700/40 text-forest-300 flex items-center justify-center touch-manipulation hover:bg-forest-800/60"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain">{children}</div>
      </div>
    </div>
  );
}

function EmptyGuideMessage({
  selectedDate,
  onClose,
  onPark,
  onOpenChat,
}: {
  selectedDate: string;
  onClose: () => void;
  onPark: () => void;
  onOpenChat: (msg?: string) => void;
}) {
  const dayLabel = formatDateLabel(selectedDate);
  return (
    <PanelChrome
      eyebrow="Analisi completata"
      title="Nessuna zona nel raggio"
      subtitle={`Per ${dayLabel} non abbiamo trovato zone con probabilità sufficiente.`}
      onPark={onPark}
      onClose={onClose}
    >
      <div className="p-5 md:p-8 space-y-6">
        <p className="text-sm text-forest-400 leading-relaxed">
          Prova ad allargare il raggio, cambiare giorno o chiedere al Mastro Fungaiolo
          un piano personalizzato.
        </p>
        <GuideChatCta
          title="Vuoi sapere di più?"
          subtitle="Il bot AI legge meteo, zone e Sprout Score come la mappa — chiedigli dove provare."
          onChat={() => {
            onPark();
            onOpenChat(buildGuideChatPrompt());
          }}
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-forest-800/80 border border-forest-700/40 text-forest-300 font-semibold touch-manipulation"
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
    </PanelChrome>
  );
}

function SpeciesPicker({
  selected,
  onToggle,
  onConfirm,
  onPark,
  onOpenChat,
}: {
  selected: MushroomSpecies[];
  onToggle: (s: MushroomSpecies) => void;
  onConfirm: () => void;
  onPark: () => void;
  onOpenChat: (msg?: string) => void;
}) {
  return (
    <PanelChrome
      eyebrow="Passo 1 · Selezione"
      title="Che funghi cerchi?"
      subtitle="Ogni specie riceve un dossier dedicato con zona, stima e roadmap."
      onPark={onPark}
    >
      <div className="p-5 md:p-8 space-y-5">
        <div className="space-y-2.5">
          {ALL_SPECIES.map((sp) => {
            const active = selected.includes(sp);
            return (
              <button
                key={sp}
                type="button"
                onClick={() => onToggle(sp)}
                className={`w-full text-left px-4 py-4 rounded-2xl border touch-manipulation transition-all ${
                  active
                    ? "border-mushroom-400/50 bg-mushroom-500/12 shadow-[0_0_0_1px_rgba(245,154,74,0.15)_inset]"
                    : "border-forest-700/40 bg-forest-950/40 hover:border-forest-600/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {SPECIES_EMOJI[sp]}
                  </span>
                  <div>
                    <span className="font-semibold text-sm text-forest-100 block">
                      {active ? "✓ " : ""}
                      {getSpeciesLabel(sp)}
                    </span>
                    <span className="text-[10px] text-forest-500 uppercase tracking-wider">
                      Analisi radar dedicata
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onConfirm}
          disabled={selected.length === 0}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-mushroom-500 to-mushroom-400 disabled:opacity-40 text-white font-bold text-sm touch-manipulation shadow-lg shadow-mushroom-500/20"
        >
          Genera {selected.length}{" "}
          {selected.length === 1 ? "dossier" : "dossier"}
        </button>

        <GuideChatCta
          compact
          title="Non sai quale scegliere?"
          subtitle="Chiedi al Mastro — ti guida passo passo."
          onChat={() => {
            onPark();
            onOpenChat(buildGuideChatPrompt(undefined, selected));
          }}
        />
      </div>
    </PanelChrome>
  );
}

export default function BeginnerGuidePanel({
  guideResult,
  isOpen,
  parked,
  onClose,
  onPark,
  onUnpark,
  onGenerate,
  onOpenChat,
  isLoading,
  hasDetailOpen,
  originReady = true,
  selectedDate = todayISO(),
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

  const handleOpenChat = (msg?: string) => {
    onPark();
    onOpenChat(msg);
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
    return (
      <BeginnerGuideBanner
        parked={parked || !!hasDetailOpen}
        compact={!!hasDetailOpen && !parked}
        onOpen={openGuide}
        onPark={handlePark}
        onOpenChat={() => handleOpenChat(buildGuideChatPrompt())}
      />
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
        onOpenChat={handleOpenChat}
      />
    );
  }

  if (isLoading) {
    return (
      <PanelChrome
        eyebrow="Elaborazione"
        title="Analisi in corso"
        subtitle="Meteo live, Sprout Score e habitat per ogni specie scelta."
        onPark={handlePark}
      >
        <div className="p-8 md:p-12 flex flex-col items-center text-center">
          <div className="relative w-16 h-16 mb-6">
            <div className="absolute inset-0 rounded-full guide-score-ring opacity-30 animate-spin" style={{ ["--score-pct" as string]: "75" }} />
            <div className="absolute inset-2 rounded-full bg-forest-950 flex items-center justify-center text-2xl">
              🍄
            </div>
          </div>
          <p className="text-sm text-forest-300 max-w-xs leading-relaxed">
            Sto costruendo i dossier personalizzati per le specie selezionate…
          </p>
        </div>
      </PanelChrome>
    );
  }

  if (!guideResult) {
    return (
      <EmptyGuideMessage
        selectedDate={selectedDate}
        onClose={() => {
          setShowSpecies(true);
          onClose();
        }}
        onPark={handlePark}
        onOpenChat={handleOpenChat}
      />
    );
  }

  const { plans, equipment, warnings } = guideResult;

  return (
    <PanelChrome
      eyebrow="Intelligence report"
      title={plans.length === 1 ? "Il tuo dossier" : `${plans.length} dossier specie`}
      subtitle="Analisi radar per principianti · zone, timing, stime e sicurezza"
      onPark={handlePark}
      onClose={onClose}
    >
      <div className="p-5 md:p-8 space-y-6 pb-8">
        {plans.map((plan, index) => (
          <SpeciesPlanCard
            key={plan.species}
            plan={plan}
            index={index}
            onOpenChat={() =>
              handleOpenChat(buildGuideChatPrompt(plan))
            }
          />
        ))}

        <GuideChatCta
          title="Vuoi approfondire?"
          subtitle="Chiedi al Mastro dettagli su habitat, lookalike, regolamento o alternative di zona."
          onChat={() =>
            handleOpenChat(
              buildGuideChatPrompt(
                plans.find((p) => p.viable) ?? plans[0],
                guideResult.requestedSpecies
              )
            )
          }
        />

        <div className="grid md:grid-cols-2 gap-4">
          <div className="guide-metric rounded-2xl p-4 md:p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-forest-500 mb-3">
              Equipaggiamento
            </p>
            <ul className="space-y-2">
              {equipment.map((item) => (
                <li
                  key={item}
                  className="text-xs text-forest-300 flex items-start gap-2 leading-relaxed"
                >
                  <span className="text-mushroom-400 mt-0.5 shrink-0">◆</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl p-4 md:p-5 bg-red-950/25 border border-red-900/30">
            <p className="text-[10px] uppercase tracking-[0.2em] text-red-400/90 mb-3">
              Sicurezza & regolamento
            </p>
            <ul className="space-y-2">
              {warnings.map((w, i) => (
                <li key={i} className="text-xs text-red-200/85 leading-relaxed flex gap-2">
                  <span className="shrink-0">⚠</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-[10px] text-center text-forest-600 tracking-wide">
          Sprout Score · Funghimagazine · Meteo live
        </p>
      </div>
    </PanelChrome>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div className="relative w-14 h-14 shrink-0">
      <div
        className="absolute inset-0 rounded-full guide-score-ring p-[3px]"
        style={{ ["--score-pct" as string]: String(Math.min(100, score)) }}
      >
        <div className="w-full h-full rounded-full bg-forest-950 flex items-center justify-center">
          <span className="text-sm font-bold text-mushroom-400 font-mono">{score}%</span>
        </div>
      </div>
    </div>
  );
}

function SpeciesPlanCard({
  plan,
  index,
  onOpenChat,
}: {
  plan: BeginnerSpeciesPlan;
  index: number;
  onOpenChat: () => void;
}) {
  return (
    <section className="guide-species-card relative rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-forest-700/30 flex items-center gap-4">
        <ScoreBadge score={plan.speciesScore} />
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.2em] text-mushroom-400/80">
            Dossier {index + 1} · {SPECIES_EMOJI[plan.species]} {plan.speciesLabel}
          </p>
          <h3 className="font-display text-xl text-forest-100 truncate">
            {plan.recommendedZone}
          </h3>
        </div>
        <span
          className="hidden sm:inline px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0"
          style={{
            backgroundColor: `${FM_TRAFFIC_LIGHT_COLORS[plan.trafficLight]}22`,
            color: FM_TRAFFIC_LIGHT_COLORS[plan.trafficLight],
          }}
        >
          FM
        </span>
      </div>

      <div className="p-5 space-y-5">
        <blockquote className="border-l-2 border-mushroom-400/60 pl-4 py-1">
          <p className="text-sm text-forest-100 leading-relaxed font-medium">
            {plan.simpleVerdict}
          </p>
        </blockquote>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
          <Metric label="Stima raccolta" value={plan.totalExpected} accent />
          <Metric label="Partenza" value={plan.departureTime} />
          <Metric label="Arrivo bosco" value={plan.arrivalTime} />
          <Metric label="Finestra" value={plan.collectionWindow} />
          <Metric label="Quota" value={plan.altitude ? `${plan.altitude} m` : "—"} />
          <Metric label="Habitat" value={plan.forestType} />
        </div>

        <div className="guide-metric rounded-xl p-4">
          <div className="flex justify-between items-baseline gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-forest-500">
              Resa stimata · {plan.yield.label}
            </span>
            <span className="text-lg font-bold text-mushroom-400 font-mono">
              {plan.yield.min === 0 ? "0" : plan.yield.min}–{plan.yield.max}{" "}
              <span className="text-xs font-sans font-normal text-forest-400">
                {plan.yield.unit}
              </span>
            </span>
          </div>
          <p className="text-[11px] text-forest-500">
            Affidabilità {plan.yield.confidence} — {plan.yield.note}
          </p>
          <p className="text-[11px] text-forest-400 mt-2 italic leading-relaxed border-t border-forest-800/60 pt-2">
            {plan.guideText}
          </p>
        </div>

        {plan.roadmap.length > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-forest-500 mb-4">
              Itinerario operativo
            </p>
            <div className="space-y-0">
              {plan.roadmap.map((step, i) => (
                <div key={step.step} className="flex gap-4">
                  <div className="flex flex-col items-center w-10 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-forest-800/80 border border-forest-700/50 flex items-center justify-center text-lg">
                      {step.icon}
                    </div>
                    {i < plan.roadmap.length - 1 && (
                      <div className="w-px flex-1 guide-timeline-line my-1.5 min-h-[28px]" />
                    )}
                  </div>
                  <div className="pb-5 flex-1 pt-0.5">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="text-xs font-mono text-mushroom-400/90">
                        {step.time}
                      </span>
                      <span className="text-sm font-semibold text-forest-100">
                        {step.title}
                      </span>
                    </div>
                    <p className="text-xs text-forest-400 mt-1.5 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {plan.mapsLink !== "#" && (
            <a
              href={plan.mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-mushroom-500 to-mushroom-600 hover:from-mushroom-400 hover:to-mushroom-500 text-white text-center font-bold text-sm shadow-lg shadow-mushroom-500/15 transition-all touch-manipulation"
            >
              🧭 Navigatore
            </a>
          )}
          <button
            type="button"
            onClick={onOpenChat}
            className="flex-1 py-3.5 rounded-xl guide-chat-btn text-white text-center font-bold text-sm touch-manipulation"
          >
            💬 Chiedi al Mastro
          </button>
        </div>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="guide-metric rounded-xl px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-[0.15em] text-forest-500 truncate">
        {label}
      </p>
      <p
        className={`text-sm font-semibold mt-0.5 truncate ${
          accent ? "text-mushroom-400" : "text-forest-200"
        }`}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}
