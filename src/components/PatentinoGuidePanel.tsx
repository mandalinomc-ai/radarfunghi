"use client";

import { useState } from "react";
import {
  getPatentinoGuide,
  LINK_KIND_COLORS,
  LINK_KIND_LABELS,
  PATENTINO_REGION_GUIDES,
  type PatentinoLink,
  type PatentinoRegionId,
} from "@/lib/patentinoGuideData";

export default function PatentinoGuidePanel() {
  const [regionId, setRegionId] = useState<PatentinoRegionId>("campania");
  const guide = getPatentinoGuide(regionId);

  return (
    <div className="space-y-5 pb-6">
      <div className="rounded-2xl border border-mushroom-500/25 bg-gradient-to-br from-mushroom-500/10 to-forest-900/40 p-4">
        <p className="text-[10px] uppercase tracking-[0.2em] text-mushroom-400 font-semibold">
          Abilitazione legale
        </p>
        <h2 className="font-display text-xl text-forest-100 mt-1 leading-snug">
          Patentino / Tesserino funghi
        </h2>
        <p className="text-xs text-forest-400 mt-2 leading-relaxed">{guide.intro}</p>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-forest-950/80 border border-forest-700/40">
        {PATENTINO_REGION_GUIDES.map((r) => (
          <button
            key={r.regionId}
            type="button"
            onClick={() => setRegionId(r.regionId)}
            className={`flex-1 py-2.5 rounded-lg text-[11px] font-semibold touch-manipulation transition-colors ${
              regionId === r.regionId
                ? "bg-mushroom-600/35 text-mushroom-100 border border-mushroom-500/40"
                : "text-forest-400 hover:bg-forest-800/50"
            }`}
          >
            {r.regionLabel}
          </button>
        ))}
      </div>

      <p className="text-[10px] text-forest-500 text-center">{guide.badge}</p>

      <Section title="Chi deve farlo">
        <ul className="space-y-2">
          {guide.whoNeedsIt.map((item) => (
            <li key={item} className="text-xs text-forest-300 flex gap-2 leading-relaxed">
              <span className="text-mushroom-400 shrink-0">•</span>
              {item}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Passo per passo">
        <ol className="space-y-3">
          {guide.steps.map((s) => (
            <li
              key={s.step}
              className="app-shell-section p-3.5 flex gap-3 !mb-0"
            >
              <span className="shrink-0 w-8 h-8 rounded-full bg-mushroom-600/30 border border-mushroom-500/40 flex items-center justify-center text-sm font-bold text-mushroom-200">
                {s.step}
              </span>
              <div>
                <p className="text-sm font-semibold text-forest-100">{s.title}</p>
                <p className="text-xs text-forest-400 mt-1 leading-relaxed">
                  {s.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section title="Documenti utili">
        <ul className="space-y-1.5">
          {guide.documents.map((d) => (
            <li key={d} className="text-xs text-forest-300 flex gap-2">
              <span className="text-forest-500">📄</span> {d}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Costi e rinnovo">
        <ul className="space-y-1.5 mb-3">
          {guide.costs.map((c) => (
            <li key={c} className="text-xs text-forest-300">
              💶 {c}
            </li>
          ))}
        </ul>
        <p className="text-xs text-forest-400 leading-relaxed bg-forest-950/50 rounded-lg p-3 border border-forest-700/30">
          <strong className="text-forest-200">Rinnovo:</strong> {guide.renewal}
        </p>
      </Section>

      <Section title="Limiti di raccolta">
        <ul className="space-y-1.5">
          {guide.limits.map((l) => (
            <li key={l} className="text-xs text-forest-300 flex gap-2">
              <span className="text-mushroom-400">⚖</span> {l}
            </li>
          ))}
        </ul>
        <p className="text-[10px] text-forest-500 mt-2">
          Riferimento: {guide.regulation.lawReference}
        </p>
      </Section>

      <Section title="Link ufficiali e materiali">
        <div className="space-y-2">
          {guide.links.map((link) => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      </Section>

      <Section title="Domande frequenti">
        <div className="space-y-3">
          {guide.faq.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-forest-700/35 bg-forest-950/40 p-3"
            >
              <p className="text-xs font-semibold text-forest-200">{item.q}</p>
              <p className="text-xs text-forest-400 mt-1 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </Section>

      <div className="rounded-xl border border-red-800/35 bg-red-950/25 p-4">
        <p className="text-[10px] uppercase tracking-wider text-red-400 font-semibold mb-2">
          Importante
        </p>
        <p className="text-xs text-red-200/90 leading-relaxed">
          MushroomRadar non rilascia patentini e non sostituisce micologi ASL. Norme e
          moduli cambiano: verifica sempre i portali regionali prima di raccogliere.
          In emergenza sospetto avvelenamento: chiama il CAV 24/7 (
          <a
            href="https://www.iss.it/cav"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-red-100"
          >
            ISS CAV
          </a>
          ).
        </p>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="text-[10px] uppercase tracking-[0.18em] text-forest-400 font-semibold mb-2.5">
        {title}
      </h3>
      {children}
    </section>
  );
}

function LinkCard({ link }: { link: PatentinoLink }) {
  const color = LINK_KIND_COLORS[link.kind];
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`block rounded-xl border p-3 touch-manipulation transition-opacity hover:opacity-90 ${color}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug">{link.title}</p>
        <span className="text-[9px] uppercase tracking-wider shrink-0 opacity-80">
          {LINK_KIND_LABELS[link.kind]}
        </span>
      </div>
      <p className="text-[11px] opacity-80 mt-1 leading-relaxed">{link.description}</p>
      <p className="text-[10px] mt-2 opacity-60 truncate">{link.url}</p>
    </a>
  );
}
