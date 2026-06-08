/**
 * Dati editoriali da Funghimagazine.it — aggiornati all'08/06/2026.
 * Fonte: https://funghimagazine.it/
 * Articolo di riferimento: Aggiornamento nascite funghi 06-06-2026
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
    "https://funghimagazine.it/aggiornamento-nascite-funghi-06-06-2026/",
  author: "Angelo Giovinazzo — Redazione FM",
  disclaimer:
    "Dati basati su analisi meteo, segnalazioni della community FM e osservazioni sul territorio. Le nascite fungine restano localizzate: verifica sempre sul posto.",
};

export const FM_WEATHER_LIVE: FMWeatherBulletin = {
  date: "08-06-2026",
  headline:
    "Giornata variabile con velature al Sud e nubi in intensificazione a Nordovest con piogge in arrivo tra pomeriggio e sera.",
  today:
    "Al mattino velature compatte tra Sud Italia (Sicilia, Calabria, Campania, Molise, Puglia). Al Nord nubi basse in Piemonte con rovesci-piogge a Nordovest dal pomeriggio, poi al piano entro sera tra Piemonte-VdA e alta Lombardia.",
  tomorrow:
    "Nubi compatte sulle Alpi con piogge al mattino; nel pomeriggio rovesci più diffusi sulle Alpi settentrionali. Rovesci-temporali a Nordest sui monti (Trentino, Friuli). Altrove sole e caldo.",
  dayAfter:
    "Giornata con nubi sparse al Nord a settentrione del Po. Nel pomeriggio locali rovesci tra Lombardia montana e Triveneto montano. In serata più rovesci su tutto il Nord.",
  outlook:
    "Giovedì piogge si spostano a Est verso Appennino settentrionale e Umbria. Venerdì più soleggiato; qualche cumulo sull'Appennino meridionale con docce sui monti Lucani.",
  source: FM_SOURCE.name,
};

export const FM_NATIONAL_REPORT: FMNationalReport = {
  date: "08-06-2026",
  title: "Semaforo dei Funghi — Situazione nascite in Italia",
  summary:
    "Aumentano le segnalazioni di ritrovamenti, soprattutto Finferli ma anche Porcini nelle aree verdi della mappa FM. Confermati primi ritrovamenti nelle zone rosa (nascite imminenti). Al Centro-Sud: Finferli e sporadici Porcini nel Lazio e Campania di confine.",
  highlights: [
    "Piogge frequenti post-caldo africano: condizioni ideali per germinazione spore",
    "Suoli freddi ancora un fattore limitante sopra i 1000m (Matese, Sila, Abruzzo)",
    "Finferli al top su colli toscani, bassa Umbria e Sabina",
    "Porcini: ripartenza attesa dalla metà della prossima settimana (10-12 giugno)",
    "Sud Italia: potenziale più basso ma Finferli in ripresa su Campania occidentale/settentrionale e Molise montano",
  ],
  topRegions: ["Umbria", "Toscana orientale", "Veneto occidentale", "Friuli collinare"],
  risingRegions: ["Lombardia collinare", "Basso Trentino", "Sabina", "Alto Lazio"],
  southItalyNote:
    "Campania appenninica e Molise: ultimi esemplari maturi ancora reperibili. Piogge recenti innescano buone nascite di Finferli sui colli e monti occidentali/settentrionali. Matese: suoli ancora troppo freddi — Porcini dopo il 10-12 giugno.",
  bestFromDate: "10-12 giugno 2026",
  source: FM_SOURCE.name,
  sourceUrl: FM_SOURCE.articleUrl,
};

export const FM_REGIONAL_STATUS: FMRegionalStatus[] = [
  {
    region: "Matese (Campania-Molise)",
    trafficLight: "giallo",
    summary:
      "Suoli ancora troppo freddi nonostante piogge recenti. Finferli in ripresa su versanti umidi; Porcini da monitorare dopo il 10-12 giugno.",
    speciesActive: ["Galletto (Finferlo)", "Russule", "Amanite"],
    speciesImminent: ["Porcino estivo", "Estatino"],
    soilStatus: "freddo",
    porciniFrom: "10-12 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "06-06-2026",
  },
  {
    region: "Taburno-Camposauro (Campania)",
    trafficLight: "rosa",
    summary:
      "Monti occidentali/settentrionali Campania: piogge locali interessanti. Buon potenziale Finferli; Porcini sporadici in boschi di Quercia-Castagno.",
    speciesActive: ["Galletto", "Estatino"],
    speciesImminent: ["Porcino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "10-12 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "06-06-2026",
  },
  {
    region: "Sannio (BN-CE)",
    trafficLight: "rosa",
    summary:
      "Colli e monti del Sannio: nascite contenute ma in crescita. Finferli su fossi umidi; cercare sotto Castagno e Quercia, non ancora in faggeta alta.",
    speciesActive: ["Galletto", "Estatino"],
    speciesImminent: ["Porcino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "12 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "06-06-2026",
  },
  {
    region: "Molise montano",
    trafficLight: "rosa",
    summary:
      "Molise di confine: discreto periodo fungino con ultimi adulti. Nuove nascite Finferli attese con piogge recenti sui rilievi boschivi.",
    speciesActive: ["Galletto", "Russule"],
    speciesImminent: ["Porcino", "Estatino"],
    soilStatus: "in_riscaldamento",
    porciniFrom: "10-12 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "06-06-2026",
  },
  {
    region: "Partenio-Irpinia (Campania)",
    trafficLight: "giallo",
    summary:
      "Campania interna: nascite porcine ancora sporadiche. Concentrarsi su boschi misti termofili; faggeta alta ancora fredda.",
    speciesActive: ["Galletto"],
    speciesImminent: ["Estatino", "Porcino"],
    soilStatus: "freddo",
    porciniFrom: "12-15 giugno 2026",
    source: FM_SOURCE.articleUrl,
    lastUpdate: "06-06-2026",
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

export function getRegionalStatusForZone(
  region: string
): FMRegionalStatus | undefined {
  const map: Record<string, string> = {
    matese: "Matese (Campania-Molise)",
    taburno: "Taburno-Camposauro (Campania)",
    sannio: "Sannio (BN-CE)",
    molise: "Molise montano",
    campania: "Partenio-Irpinia (Campania)",
  };
  const key = map[region];
  return FM_REGIONAL_STATUS.find((r) => r.region === key);
}
