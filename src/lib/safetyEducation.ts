import type { MushroomSpecies } from "./types";

export interface LookalikeWarning {
  species: MushroomSpecies;
  toxicName: string;
  toxicScientific: string;
  danger: "mortale" | "tossico" | "lieve";
  howToDistinguish: string[];
  source: string;
}

export interface IdChecklistItem {
  step: string;
  detail: string;
}

export const LOOKALIKE_DATABASE: LookalikeWarning[] = [
  {
    species: "porcino",
    toxicName: "Amanita phalloides (fungo mortale)",
    toxicScientific: "Amanita phalloides",
    danger: "mortale",
    howToDistinguish: [
      "Porcino: tubo spugnoso sotto il cappello, gambo con reticolo",
      "Amanita mortale: lamelle libere, volva al piede, anello spesso",
      "In dubbio: NON raccogliere — controllo ASL obbligatorio",
    ],
    source: "Ministero Salute / micologi ASL",
  },
  {
    species: "porcino",
    toxicName: "Boletus satanas / boli amari",
    toxicScientific: "Rubroboletus satanas",
    danger: "tossico",
    howToDistinguish: [
      "Assaggia un frammento crudo: porcino dolce, boli amari sputa subito",
      "Boli rossi: pori rossi/arancio e gambo rosso — evita",
    ],
    source: "Funghimagazine — identificazione porcini",
  },
  {
    species: "galletto",
    toxicName: "Hypholoma / funghi a lamelle su legno",
    toxicScientific: "Hypholoma fasciculare",
    danger: "tossico",
    howToDistinguish: [
      "Finferlo: pieghe false (pseudo-lamelle) decurrenti, odore fruttato",
      "Hypholoma: lamelle verdi-giallo, cresce su legno morto in fasci",
    ],
    source: "Associazioni micologiche italiane",
  },
  {
    species: "galletto",
    toxicName: "Falso finferlo (Hygrophoropsis)",
    toxicScientific: "Hygrophoropsis aurantiaca",
    danger: "lieve",
    howToDistinguish: [
      "Hygrophoropsis: lamelle vere ramificate, cresce su legno",
      "Finferlo vero: pieghe lisce, habitat su suolo forestale umido",
    ],
    source: "Funghimagazine",
  },
  {
    species: "estatino",
    toxicName: "Boletus legaliae / boli amari estivi",
    toxicScientific: "Rubroboletus legaliae",
    danger: "tossico",
    howToDistinguish: [
      "Estatino: reticolo chiaro sul gambo, pori giallini",
      "Boli amari: reticolo rosso, sapore amaro immediato",
    ],
    source: "Funghimagazine — porcino estatino",
  },
];

export const UNIVERSAL_SAFETY_RULES = [
  "Ogni raccolto commestibile va controllato da micologo ASL prima del consumo.",
  "Non raccogliere funghi che non riconosci al 100%.",
  "Non usare rastrelli: danneggiano il micelio e la lettiera.",
  "Contenitori di cesto o carta — mai sacchetti di plastica chiusi.",
  "Non pubblicare coordinate precise degli spot (rispetto ambientale).",
  "Rispetta limiti kg e tesserino regionali.",
];

export function getLookalikesForSpecies(
  species: MushroomSpecies
): LookalikeWarning[] {
  return LOOKALIKE_DATABASE.filter((l) => l.species === species);
}

export function getIdChecklist(species: MushroomSpecies): IdChecklistItem[] {
  const base: IdChecklistItem[] = [
    {
      step: "Habitat",
      detail: "La specie cresce in questo tipo di bosco e quota?",
    },
    {
      step: "Cappello",
      detail: "Forma, colore, consistenza — pori o lamelle?",
    },
    {
      step: "Gambo",
      detail: "Reticolo, anello, volva? Colore alla base?",
    },
    {
      step: "Odore e sapore",
      detail: "Finferlo profumato; boli amari sputati subito",
    },
    {
      step: "Controllo ASL",
      detail: "Porta un campione al servizio micologico prima di cucinare",
    },
  ];

  if (species === "porcino" || species === "estatino") {
    base.splice(2, 0, {
      step: "Pori",
      detail: "Porcino: pori spugnosi bianchi/gialli, NON lamelle",
    });
  }

  if (species === "galletto") {
    base.splice(2, 0, {
      step: "Pseudolamelle",
      detail: "Pieghe decurrenti e biforcate — non lamelle vere",
    });
  }

  return base;
}

export function getSafetyWarningsForSpecies(
  species: MushroomSpecies
): string[] {
  const lookalikes = getLookalikesForSpecies(species);
  const warnings = [...UNIVERSAL_SAFETY_RULES.slice(0, 3)];
  for (const l of lookalikes) {
    if (l.danger === "mortale") {
      warnings.push(
        `Attenzione: confondibile con ${l.toxicName} — ${l.danger.toUpperCase()}`
      );
    }
  }
  return warnings;
}
