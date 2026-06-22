/**
 * Dati editoriali da Funghimagazine.it — aggiornati al 21/06/2026.
 * Fonte: https://funghimagazine.it/
 * Articolo di riferimento: Aggiornamento nascite funghi 21-06-2026
 */

export type FMTrafficLight = "verde" | "rosa" | "giallo" | "rosso";

export interface FMRegionalStatus {
  region: string;
  trafficLight: FMTrafficLight;
  summary: string;
  speciesActive: string[];
  speciesImminent: string[];
  soilStatus: "freddo" | "in_riscaldamento" | "ideale" | "secco";
  porciniFrom?: string;
  source: string;
  lastUpdate: string;
}

export interface FMWeatherBulletin {
  date: string;
  headline: string;
  today: string;
  tomorrow: string;
  dayAfter: string;
  outlook: string;
  source: string;
}

export interface FMNationalReport {
  date: string;
  title: string;
  summary: string;
  highlights: string[];
  topRegions: string[];
  risingRegions: string[];
  southItalyNote: string;
  bestFromDate: string;
  source: string;
  sourceUrl: string;
}

export const FM_SOURCE = {
  name: "Funghimagazine.it",
  url: "https://funghimagazine.it/",
  articleUrl:
    "https://funghimagazine.it/aggiornamento-nascite-funghi-21-06-2026/",
  author: "Angelo Giovinazzo — Redazione FM",
  disclaimer:
    "Dati basati su analisi meteo, segnalazioni della community FM e osservazioni sul territorio. Le nascite fungine restano localizzate: verifica sempre sul posto.",
};

export const FM_WEATHER_LIVE: FMWeatherBulletin = {
  date: "21-06-2026",
  headline:
    "Solstizio d'estate: caldo moderato al Sud con cumuli pomeridiani sui rilievi; umidità in risalita dopo piogge sparse della scorsa settimana.",
  today:
    "Mattina stabile su Campania interna, Molise e Basilicata con nebbia di valle fino alle 8. Nel pomeriggio cumuli su Matese, Taburno e Pollino con docce brevi locali. Umidità relativa 65–82% in collina, suolo in riscaldamento sopra i 900 m.",
  tomorrow:
    "Giornata più soleggiata; escursione termica notturna favorevole (12–14 °C) su faggete d'altura. Possibili rovesci isolati solo su crinali lucani oltre i 1400 m.",
  dayAfter:
    "Anticiclone debole: mattinate fresche ideali per raccolta 06:00–10:00. Umidità del suolo in lento calo in pianura; boschi ombreggiati ancora ottimali per Porcini ed Estatini.",
  outlook:
    "Fine settimana con instabilità debole su Appennino meridionale: piogge sparse sabato su Molise e Matese, poi rialzo probabilità nascite su tutte le specie termofile fino a fine giugno.",
  source: FM_SOURCE.name,
};

export const FM_NATIONAL_REPORT: FMNationalReport = {
  date: "21-06-2026",
  title: "Semaforo dei Funghi — Solstizio: Porcini estivi al via al Sud",
  summary:
    "A metà giugno le nascite accelerano su tutta l'Italia centro-meridionale. Porcini estivi (B. aestivalis) e Estatini attivi su Quercia-Castagno; Finferli in picco su versanti umidi. Al Sud: suoli finalmente in temperatura sui colli sannitici e taburnini.",
  highlights: [
    "Suoli sopra soglia germinativa su colli fino a 1100 m — fine del blocco freddo del primo giugno",
    "Porcini estivi confermati su Taburno, Sannio basso e Pollino occidentale",
    "Finferli (Galletti) al massimo su fossi e castagneti con umidità >70%",
    "Estatini in crescita su boschi misti termofili; cercare dopo docce pomeridiane",
    "Matese alto: ancora selettivo sopra 1300 m, ma verde sotto quota 1200 m",
    "Previsione: settimana 23–28 giugno favorevole con piogge sparse e notti fresche",
  ],
  topRegions: [
    "Taburno-Camposauro",
    "Sannio collinare",
    "Pollino occidentale",
    "Molise montano",
  ],
  risingRegions: ["Matese medio", "Irpinia interna", "Monticchio", "Lagonegrese"],
  southItalyNote:
    "Campania-Molise-Basilicata: stagione estiva aperta. Porcini reperibili su castagneti umidi 800–1200 m; Estatini su querceti. Matese sommità: attendere piogge del weekend per faggeta alta.",
  bestFromDate: "21–28 giugno 2026",
  source: FM_SOURCE.name,
  sourceUrl: FM_SOURCE.articleUrl,
};

export const FM_REGIONAL_STATUS: FMRegionalStatus[] = [
  {
    region: "Matese (Campania-Molise)",
    trafficLight: "rosa",
    summary:
      "Suoli in riscaldamento sotto i 1200 m: Porcini ed Estatini in ripresa su castagneti e faggeta media. Sopra 1300 m ancora selettivo; Finferli al top su versanti umidi.",
    speciesActive: ["Galletto (Finferlo)", "Estatino", "Porcino estivo"],
    speciesImminent: ["Porcino in faggeta alta"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "dal 18 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Taburno-Camposauro (Campania)",
    trafficLight: "verde",
    summary:
      "Stagione estiva aperta: Porcini estivi e Estatini su Quercia-Castagno 700–1100 m. Finferli abbondanti su fossi ombreggiati dopo piogge del 14–16 giugno.",
    speciesActive: ["Porcino estivo", "Estatino", "Galletto"],
    speciesImminent: ["Russule", "Amanite"],
    soilStatus: "ideale",
    porciniFrom: "attivo dal 15 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Sannio (BN-CE)",
    trafficLight: "verde",
    summary:
      "Colli sannitici in piena attività: Porcini su castagneti umidi, Estatini su querceti. Mattino 06–10 ottimale con umidità >75%.",
    speciesActive: ["Porcino", "Estatino", "Galletto"],
    speciesImminent: ["Russule"],
    soilStatus: "ideale",
    porciniFrom: "attivo dal 16 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Molise montano",
    trafficLight: "rosa",
    summary:
      "Molise di confine: buone nascite Finferli e primi Porcini su faggeta 900–1200 m. Docce pomeridiane del weekend potenziano germinazioni.",
    speciesActive: ["Galletto", "Estatino", "Porcino"],
    speciesImminent: ["Russule"],
    soilStatus: "ideale",
    porciniFrom: "dal 18 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Partenio-Irpinia (Campania)",
    trafficLight: "rosa",
    summary:
      "Irpinia interna: Porcini sporadici ma in aumento su boschi misti. Finferli costanti; Estatini su versanti sud-est dopo umidità notturna.",
    speciesActive: ["Galletto", "Estatino"],
    speciesImminent: ["Porcino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "dal 20 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Pollino (Basilicata)",
    trafficLight: "verde",
    summary:
      "Pollino occidentale e Cozzo del Pellegrino: Porcini ed Estatini attivi su faggeta e castagneti 1000–1400 m. Community FM conferma ritrovamenti quotidiani.",
    speciesActive: ["Porcino", "Estatino", "Galletto"],
    speciesImminent: ["Russule"],
    soilStatus: "ideale",
    porciniFrom: "attivo dal 14 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Appennino Lucano (Basilicata)",
    trafficLight: "verde",
    summary:
      "Monticchio e Gallipoli Cognato: picco Finferli ed Estatini su faggeta lacustre. Porcini su versanti umidi del Vulture orientale.",
    speciesActive: ["Galletto", "Estatino", "Porcino"],
    speciesImminent: ["Russule"],
    soilStatus: "ideale",
    porciniFrom: "attivo dal 17 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Monte Vulture (Basilicata)",
    trafficLight: "rosa",
    summary:
      "Vulture: Estatini e Finferli su Quercia-Castagno; Porcini in crescita con notti fresche. Evitare pianura secca nelle ore calde.",
    speciesActive: ["Estatino", "Galletto"],
    speciesImminent: ["Porcino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "dal 20 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
  {
    region: "Lagonegrese (Basilicata)",
    trafficLight: "rosa",
    summary:
      "Faggeta d'altura del Lagonegrese: escursione termica notturna favorevole; primi Porcini sopra 1200 m, Finferli costanti su fossi.",
    speciesActive: ["Galletto", "Porcino"],
    speciesImminent: ["Estatino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "dal 19 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "21-06-2026",
  },
];

export const FM_TRAFFIC_LIGHT_LABELS: Record<FMTrafficLight, string> = {
  verde: "Nascite attive — raccogli ora",
  rosa: "Nascite imminenti — vai nei prossimi giorni",
  giallo: "Potenziale medio — solo specie rapide (Finferli)",
  rosso: "Nascite scarse o cessate",
};

export const FM_TRAFFIC_LIGHT_COLORS: Record<FMTrafficLight, string> = {
  verde: "#22c55e",
  rosa: "#ec4899",
  giallo: "#eab308",
  rosso: "#ef4444",
};

export const FM_JUNE_SPECIES = [
  "Amanita gemmata",
  "Boletus aereus (Porcino Nero)",
  "Cantharellus (Galletti/Finferli)",
  "Butyriboletus regius (Porcino Reale)",
  "Boletus aestivalis (Estatino)",
  "Russula heterophylla",
  "Agaricus (Prataioli)",
];

const ZONE_FM_MAP: Record<string, string> = {
  matese: "Matese (Campania-Molise)",
  taburno: "Taburno-Camposauro (Campania)",
  sannio: "Sannio (BN-CE)",
  molise: "Molise montano",
  campania: "Partenio-Irpinia (Campania)",
  "basilicata-pollino": "Pollino (Basilicata)",
  "basilicata-vulture": "Monte Vulture (Basilicata)",
  "basilicata-monticchio": "Appennino Lucano (Basilicata)",
  "basilicata-gallipoli": "Appennino Lucano (Basilicata)",
  "basilicata-lagonegrese": "Lagonegrese (Basilicata)",
  basilicata: "Pollino (Basilicata)",
};

export function getRegionalStatusForZone(
  region: string,
  zoneId?: string
): FMRegionalStatus | undefined {
  let key = ZONE_FM_MAP[region];

  if (region === "basilicata" && zoneId) {
    if (zoneId.includes("pollino")) key = ZONE_FM_MAP["basilicata-pollino"];
    else if (zoneId.includes("vulture")) key = ZONE_FM_MAP["basilicata-vulture"];
    else if (zoneId.includes("monticchio") || zoneId.includes("gallipoli"))
      key = ZONE_FM_MAP["basilicata-monticchio"];
    else if (zoneId.includes("lagonegrese"))
      key = ZONE_FM_MAP["basilicata-lagonegrese"];
  }

  return FM_REGIONAL_STATUS.find((r) => r.region === key);
}
