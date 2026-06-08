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
    <header className="absolute top-0 left-0 right-0 z-[1000] pointer-events-none">
      <div className="flex items-start justify-between p-4">
        <div className="pointer-events-auto bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-5 py-3 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-mushroom-500 to-forest-500 flex items-center justify-center text-xl">
              🍄
            </div>
            <div>
              <h1 className="text-xl font-bold text-forest-300 tracking-tight">
                Mushroom<span className="text-mushroom-400">Radar</span>
              </h1>
              <p className="text-xs text-forest-400/80">
                Sannio · Molise · Campania
              </p>
              <p className="text-[9px] text-mushroom-500/70 mt-0.5">
                Dati live da Funghimagazine.it
              </p>
            </div>
          </div>
        </div>

        <div className="pointer-events-auto flex gap-3">
          <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-forest-400">
              Score medio
            </p>
            <p className="text-2xl font-bold text-mushroom-400">{avgScore}%</p>
          </div>
          <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <p className="text-[10px] uppercase tracking-wider text-forest-400">
              Zone attive
            </p>
            <p className="text-2xl font-bold text-forest-300">{hotspotCount}</p>
          </div>
          <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl px-4 py-2.5 text-center min-w-[120px]">
            <p className="text-[10px] uppercase tracking-wider text-forest-400">
              Specie
            </p>
            <p className="text-sm font-semibold text-forest-300 mt-1">
              {activeSpecies === "all"
                ? "Tutte"
                : getSpeciesLabel(activeSpecies)}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
