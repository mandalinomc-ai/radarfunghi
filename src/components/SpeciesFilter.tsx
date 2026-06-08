"use client";

import type { MushroomSpecies } from "@/lib/types";
import SpeciesFilterContent from "./SpeciesFilterContent";

interface SpeciesFilterProps {
  activeSpecies: MushroomSpecies | "all";
  onSpeciesChange: (species: MushroomSpecies | "all") => void;
}

export default function SpeciesFilter({
  activeSpecies,
  onSpeciesChange,
}: SpeciesFilterProps) {
  return (
    <div className="hidden md:block absolute top-24 left-4 z-[1000] pointer-events-auto">
      <div className="bg-forest-900/90 backdrop-blur-md border border-forest-600/40 rounded-xl p-3 shadow-2xl w-56">
        <p className="text-[10px] uppercase tracking-wider text-forest-400 mb-2 px-1">
          Filtra specie
        </p>
        <SpeciesFilterContent
          activeSpecies={activeSpecies}
          onSpeciesChange={onSpeciesChange}
        />
      </div>
    </div>
  );
}
