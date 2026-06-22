import type { FungalZone, MushroomSpecies } from "./types";

export interface SpeciesHabitatRule {
  species: MushroomSpecies;
  hostTrees: string[];
  forestKeywords: string[];
  substrateHints: string[];
  searchTips: string[];
  avoid: string[];
  sources: string[];
}

export const SPECIES_HABITAT_RULES: SpeciesHabitatRule[] = [
  {
    species: "estatino",
    hostTrees: ["Castanea sativa", "Quercus", "Carpino"],
    forestKeywords: ["castagneto", "querceto", "misto", "termofil"],
    substrateHints: [
      "Lettiera umida sotto castagno o quercia",
      "Zone luminose ma ombreggiate",
      "Muschio su radici esposte",
    ],
    searchTips: [
      "Cerca dopo docce pomeridiane o notti umide",
      "Versanti est/sud-est spesso più precoci al Sud",
      "Taglia il gambo, non strappare dal micelio",
    ],
    avoid: ["Radure ventilate", "Suolo polveroso dopo giorni di scirocco"],
    sources: [
      "Funghimagazine — Boletus aestivalis/reticulatus",
      "Calendario porcini primavera-estate FM",
    ],
  },
  {
    species: "porcino",
    hostTrees: ["Fagus", "Castanea", "Pinus", "Abies"],
    forestKeywords: ["faggeta", "castagneto", "misto", "pino", "abete"],
    substrateHints: [
      "Sotto muschio vicino radici di faggio o castagno",
      "Versanti nord umidi in estate",
      "Fossi e depressioni con umidità persistente",
    ],
    searchTips: [
      "Mattino 06–10 con umidità relativa alta",
      "Dopo 7–10 giorni da piogge ≥15 mm",
      "Estate al Sud: porcino estivo sotto castagno/quercia 700–1200 m",
    ],
    avoid: [
      "Boschi ventilati dopo maestrale",
      "Lettiera secca nonostante piogge recenti",
    ],
    sources: [
      "Funghimagazine — Meteofunghi 2026",
      "Calendario porcini primavera-estate FM",
    ],
  },
  {
    species: "galletto",
    hostTrees: ["Fagus", "Castanea", "Quercus", "Pinus"],
    forestKeywords: ["fosso", "faggeta", "castagneto", "lacust", "umid"],
    substrateHints: [
      "Fossi, depressioni, sponde ombreggiate",
      "Muschio e lettiera profonda",
      "Spesso in gruppi o archi",
    ],
    searchTips: [
      "Resiste meglio del porcino a vento leggero",
      "Cerca con umidità >70% anche nel pomeriggio",
      "Colore giallo-arancio ben visibile tra muschio",
    ],
    avoid: ["Confondere con Hypholoma su legno (tossico)"],
    sources: ["Funghimagazine — Cantharellus cibarius"],
  },
];

function normalizeForest(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function getHabitatRule(species: MushroomSpecies): SpeciesHabitatRule {
  const rule = SPECIES_HABITAT_RULES.find((r) => r.species === species);
  if (!rule) return SPECIES_HABITAT_RULES[0];
  return rule;
}

export function calculateHabitatScore(
  zone: FungalZone,
  species: MushroomSpecies
): number {
  const rule = getHabitatRule(species);
  const forest = normalizeForest(zone.forestType);
  let score = 45;

  let keywordHits = 0;
  for (const kw of rule.forestKeywords) {
    if (forest.includes(normalizeForest(kw))) keywordHits++;
  }
  score += Math.min(35, keywordHits * 12);

  if (forest.includes("fosso") || forest.includes("umid")) {
    if (species === "galletto") score += 12;
    if (species === "porcino") score += 6;
  }

  if (forest.includes("castagneto") || forest.includes("querceto")) {
    if (species === "estatino") score += 10;
    if (species === "porcino") score += 5;
  }

  if (forest.includes("faggeta")) {
    if (species === "porcino") score += 8;
    if (species === "galletto") score += 6;
  }

  return Math.min(100, Math.max(20, score));
}

export function getHabitatGuideForZone(
  zone: FungalZone,
  species: MushroomSpecies
): {
  searchTips: string[];
  substrate: string[];
  avoid: string[];
  habitatScore: number;
} {
  const rule = getHabitatRule(species);
  return {
    searchTips: rule.searchTips,
    substrate: rule.substrateHints,
    avoid: rule.avoid,
    habitatScore: calculateHabitatScore(zone, species),
  };
}
