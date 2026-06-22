export type SourceCategory = "meteo" | "agrometeo" | "editoriale" | "geocoding";

export interface OfficialDataSource {
  id: string;
  name: string;
  shortName: string;
  category: SourceCategory;
  url: string;
  description: string;
  certified: boolean;
  refreshIntervalMin: number;
}

export const OFFICIAL_DATA_SOURCES: OfficialDataSource[] = [
  {
    id: "open-meteo",
    name: "Open-Meteo (ECMWF / GFS / ICON)",
    shortName: "Open-Meteo",
    category: "meteo",
    url: "https://open-meteo.com/",
    description:
      "Modelli meteorologici ufficiali: pioggia, temperatura, umidità e umidità del suolo in tempo reale.",
    certified: true,
    refreshIntervalMin: 15,
  },
  {
    id: "arpa-campania",
    name: "ARPA Campania — Centro Funzionale Meteo-Hidro",
    shortName: "ARPA Campania",
    category: "agrometeo",
    url: "https://www.arpacampania.it/meteo/",
    description:
      "Agenzia Regionale Protezione Ambientale Campania: bollettini meteo e agrometeo regionali.",
    certified: true,
    refreshIntervalMin: 60,
  },
  {
    id: "arpa-molise",
    name: "ARPA Molise — Servizio Meteo",
    shortName: "ARPA Molise",
    category: "agrometeo",
    url: "https://www.arpamolise.it/meteo/",
    description:
      "Agenzia Regionale Protezione Ambientale Molise: monitoraggio meteo regionale.",
    certified: true,
    refreshIntervalMin: 60,
  },
  {
    id: "arpa-basilicata",
    name: "ARPA Basilicata — Meteo",
    shortName: "ARPA Basilicata",
    category: "agrometeo",
    url: "https://www.arpa.basilicata.it/meteo/",
    description:
      "Agenzia Regionale Protezione Ambientale Basilicata: dati meteo e ambientali.",
    certified: true,
    refreshIntervalMin: 60,
  },
  {
    id: "nominatim",
    name: "OpenStreetMap Nominatim",
    shortName: "OSM Nominatim",
    category: "geocoding",
    url: "https://nominatim.openstreetmap.org/",
    description: "Geocodifica luoghi per la ricerca per località.",
    certified: true,
    refreshIntervalMin: 0,
  },
  {
    id: "funghimagazine",
    name: "Funghimagazine.it",
    shortName: "Funghimagazine",
    category: "editoriale",
    url: "https://funghimagazine.it/",
    description:
      "Bollettino editoriale fungino, calendario specie e segnalazioni community — fonte specialistica verificabile.",
    certified: true,
    refreshIntervalMin: 1440,
  },
];

export interface SourceStatus {
  id: string;
  name: string;
  shortName: string;
  category: SourceCategory;
  url: string;
  certified: boolean;
  lastUpdate: string | null;
  status: "live" | "cached" | "offline" | "editorial";
  ageMinutes: number | null;
}

export function formatSourceAge(ageMinutes: number | null): string {
  if (ageMinutes === null) return "—";
  if (ageMinutes < 1) return "adesso";
  if (ageMinutes < 60) return `${ageMinutes} min fa`;
  const h = Math.floor(ageMinutes / 60);
  if (h < 24) return `${h}h fa`;
  return `${Math.floor(h / 24)}g fa`;
}
