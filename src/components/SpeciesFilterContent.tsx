"use client";

import type { MushroomSpecies } from "@/lib/types";
import { SPECIES_COLORS } from "@/lib/mapUtils";
import { getSpeciesLabel, getSpeciesScientific } from "@/lib/predictionEngine";

interface SpeciesFilterContentProps {
  activeSpecies: MushroomSpecies | "all";
  onSpeciesChange: (species: MushroomSpecies | "all") => void;
}

const SPECIES_LIST: MushroomSpecies[] = ["estatino", "galletto", "porcino"];

export default function SpeciesFilterContent({
  activeSpecies,
  onSpeciesChange,
}: SpeciesFilterContentProps) {
  return (
    <div>
      <button
        onClick={() => onSpeciesChange("all")}
        className={`w-full text-left px-4 py-3 rounded-xl mb-2 text-sm transition-all touch-manipulation ${
          activeSpecies === "all"
            ? "bg-forest-600 text-white"
            : "bg-forest-950/60 text-forest-300 border border-forest-700/30"
        }`}
      >
        Tutte le specie
      </button>
      {SPECIES_LIST.map((species) => (
        <button
          key={species}
          onClick={() => onSpeciesChange(species)}
          className={`w-full text-left px-4 py-3 rounded-xl mb-2 transition-all touch-manipulation ${
            activeSpecies === species
              ? "bg-forest-600 text-white"
              : "bg-forest-950/60 text-forest-300 border border-forest-700/30"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: SPECIES_COLORS[species] }}
            />
            <div>
              <span className="text-sm font-medium block">
                {getSpeciesLabel(species)}
              </span>
              <span className="text-[11px] text-forest-400 italic">
                {getSpeciesScientific(species)}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
