"use client";

import type { FungalZone, MushroomSpecies } from "@/lib/types";
import { getHabitatGuideForZone } from "@/lib/speciesHabitat";
import {
  getLookalikesForSpecies,
  getIdChecklist,
} from "@/lib/safetyEducation";
import {
  formatRegulationSummary,
  getRegulationForZoneRegion,
} from "@/lib/regionalRegulations";
import { getExpertTipsForZone } from "@/lib/expertTips";
import {
  getSeasonPhase,
  MONTH_NAMES_IT,
  getMonthFromDate,
} from "@/lib/seasonalCalendar";

interface MycologyKnowledgeSectionsProps {
  zone: FungalZone;
  species: MushroomSpecies;
  selectedDate: string;
  compact?: boolean;
}

export default function MycologyKnowledgeSections({
  zone,
  species,
  selectedDate,
  compact,
}: MycologyKnowledgeSectionsProps) {
  const habitat = getHabitatGuideForZone(zone, species);
  const lookalikes = getLookalikesForSpecies(species);
  const checklist = getIdChecklist(species);
  const tips = getExpertTipsForZone(zone, species, selectedDate);
  const reg = getRegulationForZoneRegion(zone.region);
  const month = getMonthFromDate(selectedDate);
  const phase = getSeasonPhase(species, month);

  const phaseLabel =
    phase === "peak"
      ? "Picco stagionale"
      : phase === "active"
        ? "In stagione"
        : phase === "emerging"
          ? "Inizio/fine stagione"
          : "Fuori stagione";

  return (
    <div className={`space-y-3 ${compact ? "text-[11px]" : "text-xs"}`}>
      <Section title="📅 Stagionalità" accent="mushroom">
        <p className="text-forest-300">
          {MONTH_NAMES_IT[month]} — <strong>{phaseLabel}</strong> per questa
          specie al Sud
        </p>
      </Section>

      <Section title="🌲 Dove cercare (habitat)" accent="green">
        <ul className="list-disc pl-4 space-y-0.5 text-forest-400">
          {habitat.substrate.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="text-[10px] text-forest-500 mt-1.5">
          Match habitat zona: {habitat.habitatScore}%
        </p>
      </Section>

      {tips.length > 0 && (
        <Section title="🎓 Consigli esperti" accent="mushroom">
          {tips.map((t) => (
            <div key={t.id} className="mb-2 last:mb-0">
              <p className="font-medium text-forest-200">{t.title}</p>
              <p className="text-forest-400 leading-snug">{t.tip}</p>
              <p className="text-[9px] text-forest-600 mt-0.5">{t.source}</p>
            </div>
          ))}
        </Section>
      )}

      <Section title="⚠️ Sicurezza — confusioni" accent="red">
        {lookalikes.slice(0, 2).map((l) => (
          <div
            key={l.toxicScientific}
            className="mb-2 last:mb-0 border-l-2 border-red-500/40 pl-2"
          >
            <p className="font-medium text-red-300/90">
              {l.toxicName}{" "}
              <span className="text-[9px] uppercase">({l.danger})</span>
            </p>
            <p className="text-forest-500 text-[10px] leading-snug">
              {l.howToDistinguish[0]}
            </p>
          </div>
        ))}
        <details className="mt-2">
          <summary className="text-mushroom-400 cursor-pointer text-[10px]">
            Checklist identificazione
          </summary>
          <ol className="list-decimal pl-4 mt-1 space-y-0.5 text-forest-500">
            {checklist.map((c) => (
              <li key={c.step}>
                <strong>{c.step}:</strong> {c.detail}
              </li>
            ))}
          </ol>
        </details>
      </Section>

      <Section title="⚖️ Normativa" accent="blue">
        <p className="text-forest-300 font-medium">{reg.regionLabel}</p>
        <p className="text-forest-500 text-[10px]">{reg.lawReference}</p>
        <ul className="list-disc pl-4 mt-1 space-y-0.5 text-forest-400">
          {reg.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <a
          href={reg.officialPortal}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mt-2 text-[10px] text-mushroom-400 underline"
        >
          Portale ufficiale →
        </a>
        <p className="text-[9px] text-forest-600 mt-1">
          {formatRegulationSummary(zone.region)}
        </p>
      </Section>
    </div>
  );
}

function Section({
  title,
  children,
  accent,
}: {
  title: string;
  children: React.ReactNode;
  accent: "mushroom" | "green" | "red" | "blue";
}) {
  const border =
    accent === "red"
      ? "border-red-500/20"
      : accent === "green"
        ? "border-green-500/20"
        : accent === "blue"
          ? "border-blue-500/20"
          : "border-mushroom-500/20";

  return (
    <div
      className={`bg-forest-950/50 rounded-xl p-3 border ${border}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-forest-500 font-semibold mb-1.5">
        {title}
      </p>
      {children}
    </div>
  );
}
