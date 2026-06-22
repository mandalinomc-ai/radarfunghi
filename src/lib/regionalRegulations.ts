import type { FungalZone } from "./types";

export interface RegionalRegulation {
  regionId: string;
  regionLabel: string;
  lawReference: string;
  lawUrl: string;
  tesserinoRequired: boolean;
  tesserinoNote: string;
  maxKgPerDay: number;
  maxKgSpecialSpecies?: { species: string; maxKg: number };
  minCapDiameterCm?: number;
  collectionHours: string;
  closedDays?: string[];
  forbiddenTools: string[];
  containerRules: string;
  minAge: number;
  officialPortal: string;
  highlights: string[];
}

export const REGIONAL_REGULATIONS: RegionalRegulation[] = [
  {
    regionId: "campania",
    regionLabel: "Campania",
    lawReference: "L.R. Campania 24/07/2007 n. 8",
    lawUrl:
      "https://funghietartufi.regione.campania.it/docfunghietartufi/funghi_info.php",
    tesserinoRequired: true,
    tesserinoNote:
      "Tesserino quinquennale dopo colloquio abilitativo o attestato micologo. Convalida annuale €30 (PagoPA cod. 1159).",
    maxKgPerDay: 3,
    maxKgSpecialSpecies: {
      species: "Ovolo buono (A. caesarea) + Prugnolo (C. gambosa)",
      maxKg: 1,
    },
    minCapDiameterCm: 3,
    collectionHours: "Da 1 ora prima dell'alba a 1 ora dopo il tramonto",
    forbiddenTools: ["Rastrelli", "Attrezzi che rovesciano la lettiera"],
    containerRules: "Cesto traspirante o carta — no plastica chiusa",
    minAge: 14,
    officialPortal: "https://funghietartufi.regione.campania.it/",
    highlights: [
      "Max 3 kg/giorno per persona",
      "Max 1 kg complessivo tra Ovolo e Prugnolo",
      "Vietati funghi con cappello <3 cm (salvo concresciuti)",
    ],
  },
  {
    regionId: "molise",
    regionLabel: "Molise",
    lawReference: "L.R. Molise 11/08/1999 n. 23 (e successive)",
    lawUrl: "https://www.regione.molise.it/",
    tesserinoRequired: true,
    tesserinoNote:
      "Autorizzazione regionale alla raccolta — verifica sul portale Molise.",
    maxKgPerDay: 2,
    collectionHours: "Diurno — verifica orari su regolamento aggiornato",
    forbiddenTools: ["Rastrelli"],
    containerRules: "Contenitori idonei e traspiranti",
    minAge: 14,
    officialPortal: "https://www.regione.molise.it/",
    highlights: [
      "Limite giornaliero generalmente 2 kg (verifica testo vigente)",
      "Rispetto parchi e aree protette del Matese",
    ],
  },
  {
    regionId: "basilicata",
    regionLabel: "Basilicata",
    lawReference: "L.R. Basilicata 23/07/1999 n. 22",
    lawUrl: "https://www.regione.basilicata.it/",
    tesserinoRequired: true,
    tesserinoNote: "Tesserino regionale per raccolta funghi epigei.",
    maxKgPerDay: 3,
    collectionHours: "Diurno",
    forbiddenTools: ["Rastrelli"],
    containerRules: "Cesto di vimini o carta",
    minAge: 14,
    officialPortal: "https://www.regione.basilicata.it/",
    highlights: [
      "Attenzione a Parco del Pollino — regolamenti specifici del parco",
      "Max 3 kg/giorno su base regionale",
    ],
  },
];

const ZONE_REGION_TO_REG: Record<FungalZone["region"], string> = {
  campania: "campania",
  sannio: "campania",
  taburno: "campania",
  matese: "campania",
  molise: "molise",
  basilicata: "basilicata",
};

export function getRegulationForZoneRegion(
  region: FungalZone["region"]
): RegionalRegulation {
  const id = ZONE_REGION_TO_REG[region] ?? "campania";
  return (
    REGIONAL_REGULATIONS.find((r) => r.regionId === id) ??
    REGIONAL_REGULATIONS[0]
  );
}

export function getRegulationHighlightsForZone(
  region: FungalZone["region"]
): string[] {
  const reg = getRegulationForZoneRegion(region);
  return reg.highlights;
}

export function formatRegulationSummary(
  region: FungalZone["region"]
): string {
  const reg = getRegulationForZoneRegion(region);
  return `${reg.regionLabel}: max ${reg.maxKgPerDay} kg/giorno${
    reg.tesserinoRequired ? ", tesserino obbligatorio" : ""
  }. ${reg.collectionHours}.`;
}
