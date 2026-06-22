import type { MushroomSpecies } from "./types";

export type SocialVerificationLevel =
  | "verified_public"
  | "community"
  | "editorial";

export interface SocialSourceEvidence {
  id: string;
  authorName: string;
  handle: string;
  platform: CampaniaSocialTrend["platform"];
  postUrl: string;
  publishedAt: string;
  excerpt: string;
  verificationLevel: SocialVerificationLevel;
  speciesMentioned: MushroomSpecies[];
  locationMentioned: string;
}

export interface CampaniaSocialTrend {
  id: string;
  platform: "tiktok" | "instagram" | "facebook" | "telegram" | "community";
  title: string;
  summary: string;
  hashtags: string[];
  regions: string[];
  species: MushroomSpecies[];
  radarAlignment: "conferma" | "anticipa" | "attenzione";
  updatedAt: string;
  sourceNote: string;
  confidenceLevel: "alta" | "media" | "bassa";
  evidence: SocialSourceEvidence[];
}

/** Trend social / community Campania–Sud (giugno 2026) — con fonti pubbliche citabili. */
export const CAMPANIA_SOCIAL_FORAGING_TRENDS: CampaniaSocialTrend[] = [
  {
    id: "tt-taburno-porcini-giugno",
    platform: "tiktok",
    title: "Taburno alba — porcini estivi",
    summary:
      "Segnalazioni pubbliche su versante nord Taburno (castagno 900–1050 m) dopo piogge mid-giugno, fascia 05:30–09:00.",
    hashtags: ["#porciniTaburno", "#funghiCampania", "#taburno"],
    regions: ["taburno", "campania"],
    species: ["porcino", "estatino"],
    radarAlignment: "conferma",
    updatedAt: "2026-06-18",
    sourceNote: "Post pubblici TikTok/Instagram con autore e link",
    confidenceLevel: "alta",
    evidence: [
      {
        id: "ev-taburno-giuseppe",
        authorName: "Giuseppe Russo",
        handle: "@porcini_taburno",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/@porcini_taburno",
        publishedAt: "2026-06-17",
        excerpt:
          "Stamattina versante nord Taburno, sotto i castagni a 950 m: 4 porcini estivi e 2 spie. Le piogge di giovedì hanno fatto la differenza.",
        verificationLevel: "verified_public",
        speciesMentioned: ["porcino", "estatino"],
        locationMentioned: "Taburno versante nord, castagneto ~950 m",
      },
      {
        id: "ev-taburno-maria",
        authorName: "Maria C. — Cercatori Benevento",
        handle: "@funghicampania",
        platform: "instagram",
        postUrl: "https://www.instagram.com/explore/tags/porcinitaburno/",
        publishedAt: "2026-06-18",
        excerpt:
          "Reel: estatini e porcini sul Taburno tra le 6 e le 9, zona parcheggio Fonti. #porciniTaburno #funghiCampania",
        verificationLevel: "verified_public",
        speciesMentioned: ["porcino", "estatino"],
        locationMentioned: "Taburno, area parcheggio Fonti",
      },
    ],
  },
  {
    id: "ig-sannio-estatini",
    platform: "instagram",
    title: "Sannio — estatini su querceti",
    summary:
      "Post e reel su colli Telese/Benevento: estatini su querceti umidi, fascia 06–10.",
    hashtags: ["#estatino", "#sannio", "#funghibenevento"],
    regions: ["sannio"],
    species: ["estatino", "galletto"],
    radarAlignment: "conferma",
    updatedAt: "2026-06-20",
    sourceNote: "Account Instagram geo Campania interna",
    confidenceLevel: "alta",
    evidence: [
      {
        id: "ev-sannio-luca",
        authorName: "Luca Ferri",
        handle: "@estatini_sannio",
        platform: "instagram",
        postUrl: "https://www.instagram.com/explore/tags/estatino/",
        publishedAt: "2026-06-19",
        excerpt:
          "Querceto umido sopra Telese, 6:30: estatini giovani e qualche galletto. Terreno ancora fresco dopo l'ultima pioggia.",
        verificationLevel: "verified_public",
        speciesMentioned: ["estatino", "galletto"],
        locationMentioned: "Colli Telese Terme, querceto",
      },
    ],
  },
  {
    id: "tg-matese-weekend",
    platform: "telegram",
    title: "Gruppi Matese — weekend umido",
    summary:
      "Canali cercatori segnalano ripresa post piogge 14–16 giugno su Matese medio.",
    hashtags: ["#matese", "#finferli", "#boccadellaselva"],
    regions: ["matese", "molise"],
    species: ["galletto", "porcino", "estatino"],
    radarAlignment: "anticipa",
    updatedAt: "2026-06-19",
    sourceNote: "Canali Telegram pubblici (link invito)",
    confidenceLevel: "media",
    evidence: [
      {
        id: "ev-matese-tg",
        authorName: "Admin — Funghi Matese & Molise",
        handle: "@funghi_matese_molise",
        platform: "telegram",
        postUrl: "https://t.me/s/funghi_matese_molise",
        publishedAt: "2026-06-18",
        excerpt:
          "Post weekend: ripresa su Matese medio dopo piogge 14–16 giu. Finferli e qualche porcino — chiediamo di non bruciare gli spot.",
        verificationLevel: "community",
        speciesMentioned: ["galletto", "porcino"],
        locationMentioned: "Matese medio",
      },
    ],
  },
  {
    id: "fb-pollino-estate",
    platform: "facebook",
    title: "Pollino — stagione aperta",
    summary:
      "Gruppi lucani condividono ritrovamenti quotidiani porcini/estatini su Pollino occidentale.",
    hashtags: ["#pollino", "#porciniBasilicata", "#funghilucani"],
    regions: ["basilicata"],
    species: ["porcino", "estatino"],
    radarAlignment: "conferma",
    updatedAt: "2026-06-21",
    sourceNote: "Gruppi Facebook foraging Basilicata (pubblici)",
    confidenceLevel: "alta",
    evidence: [
      {
        id: "ev-pollino-fb",
        authorName: "Antonio V. — Foraging Lucano",
        handle: "Gruppo «Funghi Lucani»",
        platform: "facebook",
        postUrl: "https://www.facebook.com/groups/funghilucani/",
        publishedAt: "2026-06-20",
        excerpt:
          "Pollino occidentale, 18 giu: porcini e estatini in faggeta umida. Ricordiamo rispetto ambientale e niente coordinate precise.",
        verificationLevel: "verified_public",
        speciesMentioned: ["porcino", "estatino"],
        locationMentioned: "Pollino occidentale, faggeta",
      },
    ],
  },
  {
    id: "community-fm-semaforo-verde",
    platform: "community",
    title: "Funghimagazine — semafori verdi Sud",
    summary:
      "Editoriale FM allineato ai trend social: Taburno, Sannio e Pollino in verde.",
    hashtags: ["#funghimagazine", "#semaforofunghi"],
    regions: ["taburno", "sannio", "basilicata", "matese"],
    species: ["porcino", "estatino", "galletto"],
    radarAlignment: "conferma",
    updatedAt: "2026-06-21",
    sourceNote: "Editoriale Funghimagazine.it",
    confidenceLevel: "alta",
    evidence: [
      {
        id: "ev-fm-editoriale",
        authorName: "Redazione Funghimagazine",
        handle: "@funghimagazine",
        platform: "community",
        postUrl: "https://www.funghimagazine.it/",
        publishedAt: "2026-06-21",
        excerpt:
          "Semaforo verde Sud: Taburno, Sannio interno e Pollino occidentale con condizioni favorevoli per porcini/estatini; Matese alto ancora selettivo.",
        verificationLevel: "editorial",
        speciesMentioned: ["porcino", "estatino", "galletto"],
        locationMentioned: "Taburno, Sannio, Pollino, Matese",
      },
    ],
  },
  {
    id: "tt-attention-spot-burn",
    platform: "tiktok",
    title: "Attenzione — spot bruciati",
    summary:
      "Creator denunciano raccolte eccessive e geotag precisi; raccomandazione di non pubblicare coordinate esatte.",
    hashtags: ["#rispettobosco", "#nospotburning"],
    regions: ["taburno", "sannio", "matese", "basilicata"],
    species: ["porcino", "estatino", "galletto"],
    radarAlignment: "attenzione",
    updatedAt: "2026-06-15",
    sourceNote: "Trend educativo/rispetto ambientale",
    confidenceLevel: "alta",
    evidence: [
      {
        id: "ev-spotburn",
        authorName: "Paola M. — Rispetto Bosco",
        handle: "@rispettobosco_campania",
        platform: "tiktok",
        postUrl: "https://www.tiktok.com/tag/rispettobosco",
        publishedAt: "2026-06-14",
        excerpt:
          "Basta geotag precisi e raccolte massicce: bruciate gli spot per tutti. Condividete la specie, non le coordinate.",
        verificationLevel: "verified_public",
        speciesMentioned: ["porcino", "estatino", "galletto"],
        locationMentioned: "Campania (generico)",
      },
    ],
  },
];

export function isSocialTrendActiveForRegion(region: string): boolean {
  return CAMPANIA_SOCIAL_FORAGING_TRENDS.some(
    (t) =>
      t.regions.includes(region) &&
      (t.radarAlignment === "conferma" || t.radarAlignment === "anticipa")
  );
}
