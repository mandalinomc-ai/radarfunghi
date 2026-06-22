/**
 * Segnali regionali in stile monitoraggio AMINT / community micologica.
 * Aggiornare manualmente quando AMINT o FM segnalano nascite — non scrapato.
 */
import type { FungalZone } from "./types";

export type AmintBirthSignal = "attivo" | "moderato" | "scarso";

export interface AmintRegionalHint {
  region: FungalZone["region"];
  signal: AmintBirthSignal;
  species: ("porcino" | "estatino" | "galletto" | "all")[];
  note: string;
  updatedAt: string;
}

/** Allineato a bollettini community (AMINT/FM) — giugno 2026 */
export const AMINT_REGIONAL_HINTS: AmintRegionalHint[] = [
  {
    region: "taburno",
    signal: "attivo",
    species: ["porcino", "estatino"],
    note: "Castagneti e faggete Taburno: prime segnalazioni estatini post-temporale.",
    updatedAt: "2026-06-08",
  },
  {
    region: "matese",
    signal: "moderato",
    species: ["porcino"],
    note: "Matese quota media: porcini selettivi, attendere umidità su faggeta alta.",
    updatedAt: "2026-06-08",
  },
  {
    region: "sannio",
    signal: "attivo",
    species: ["porcino", "galletto"],
    note: "Appennino sannita: finferli su versanti umidi, porcini in ripresa.",
    updatedAt: "2026-06-08",
  },
  {
    region: "molise",
    signal: "moderato",
    species: ["porcino"],
    note: "Molise interno: segnalazioni sparse, meglio dopo piogge locali.",
    updatedAt: "2026-06-08",
  },
  {
    region: "campania",
    signal: "attivo",
    species: ["estatino", "porcino"],
    note: "Irpinia/Partenio: estatini su querceti umidi, porcini su castagno.",
    updatedAt: "2026-06-08",
  },
  {
    region: "basilicata",
    signal: "moderato",
    species: ["porcino", "galletto"],
    note: "Pollino/Appennino lucano: attività altitudine dipendente.",
    updatedAt: "2026-06-08",
  },
];

export function getAmintHintForZone(
  region: FungalZone["region"],
  species: FungalZone["species"][number]
): AmintRegionalHint | undefined {
  return AMINT_REGIONAL_HINTS.find(
    (h) =>
      h.region === region &&
      (h.species.includes("all") || h.species.includes(species))
  );
}

export function amintSignalMultiplier(signal: AmintBirthSignal): number {
  if (signal === "attivo") return 1.08;
  if (signal === "moderato") return 1.03;
  return 0.95;
}
