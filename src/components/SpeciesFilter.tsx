"use client";

import type { MushroomSpecies } from "@/lib/types";
import { SPECIES_COLORS } from "@/lib/mapUtils";
import { getSpeciesLabel, getSpeciesScientific } from "@/lib/predictionEngine";

interface SpeciesFilterProps {
  activeSpecies: MushroomSpecies | "all";
  onSpeciesChange: (species: MushroomSpecies | "all") => void;
}

const SPECIES_LIST: MushroomSpecies[] = ["estatino", "galletto", "porcino"];

export default function SpeciesFilter({
  activeSpecies,
  onSpeciesChange,
}: SpeciesFilterProps) {
  return (
    <div className="absolute top-24 left-4 z-[1000] pointer-events-auto">
      <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl p-3 shadow-2xl w-56">
        <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2 px-1">
          Filtra specie
        </p>
        <button
          onClick={() => onSpeciesChange("all")}
          className={`w-full text-left px-3 py-2 rounded-lg mb-1 text-sm transition-all ${
            activeSpecies === "all"
              ? "bg-forest-600 text-white"
              : "text-forest-300 hover:bg-forest-800"
          }`}
        >
          Tutte le specie
        </button>
        {SPECIES_LIST.map((species) => (
          <button
            key={species}
            onClick={() => onSpeciesChange(species)}
            className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-all ${
              activeSpecies === species
                ? "bg-forest-600 text-white"
                : "text-forest-300 hover:bg-forest-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: SPECIES_COLORS[species] }}
              />
              <div>
                <span className="text-sm font-medium">
                  {getSpeciesLabel(species)}
                </span>
                <span className="block text-[10px] text-forest-400 italic">
                  {getSpeciesScientific(species)}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
