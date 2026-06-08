"use client";

import type { MushroomSpecies } from "@/lib/types";
import { getSpeciesLabel } from "@/lib/predictionEngine";

interface HeaderProps {
  activeSpecies: MushroomSpecies | "all";
  avgScore: number;
  hotspotCount: number;
}

export default function Header({
  activeSpecies,
  avgScore,
  hotspotCount,
}: HeaderProps) {
  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none safe-top">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 p-2 md:p-4">
        <div className="pointer-events-auto bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-3 py-2 md:px-5 md:py-3 shadow-2xl">
          <div className="flex items-center gap-2 md:gap-3">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-gradient-to-br from-mushroom-500 to-forest-500 flex items-center justify-center text-base md:text-xl shrink-0">
              🍄
            </div>
            <div className="min-w-0">
              <h1 className="text-base md:text-xl font-bold text-forest-300 tracking-tight truncate">
                Mushroom<span className="text-mushroom-400">Radar</span>
              </h1>
              <p className="text-[10px] md:text-xs text-forest-400/80 truncate">
                Sannio · Molise · Campania · Basilicata
              </p>
              <p className="hidden md:block text-[9px] text-mushroom-500/70 mt-0.5">
                Dati live da Funghimagazine.it
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-1.5 md:gap-3">
          <StatCard label="Score" value={`${avgScore}%`} highlight />
          <StatCard label="Zone" value={String(hotspotCount)} />
          <StatCard
            label="Specie"
            value={
              activeSpecies === "all"
                ? "Tutte"
                : getSpeciesLabel(activeSpecies)
            }
            small
          />
        </div>
      </div>
    </header>
  );
}

function StatCard({
  label,
  value,
  highlight,
  small,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className="flex-1 md:flex-none bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-2.5 py-2 md:px-4 md:py-2.5 text-center min-w-0 md:min-w-[90px]">
      <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-forest-400 truncate">
        {label}
      </p>
      <p
        className={`font-bold truncate ${
          small
            ? "text-xs md:text-sm text-forest-300 mt-0.5"
            : highlight
              ? "text-xl md:text-2xl text-mushroom-400"
              : "text-xl md:text-2xl text-forest-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
