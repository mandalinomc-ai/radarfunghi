import type { FungalZone } from "./types";

/** Fattori agrometeo regionali (ARPA) — correzione su Open-Meteo */
export const REGIONAL_AGROMETEO: Record<
  FungalZone["region"],
  {
    agency: string;
    agencyUrl: string;
    humidityBias: number;
    soilMoistureBias: number;
    rainBias: number;
  }
> = {
  matese: {
    agency: "ARPA Campania / Molise",
    agencyUrl: "https://www.arpacampania.it/meteo/",
    humidityBias: 4,
    soilMoistureBias: 3,
    rainBias: 1.05,
  },
  taburno: {
    agency: "ARPA Campania",
    agencyUrl: "https://www.arpacampania.it/meteo/",
    humidityBias: 3,
    soilMoistureBias: 2,
    rainBias: 1.02,
  },
  sannio: {
    agency: "ARPA Campania",
    agencyUrl: "https://www.arpacampania.it/meteo/",
    humidityBias: 2,
    soilMoistureBias: 2,
    rainBias: 1.0,
  },
  molise: {
    agency: "ARPA Molise",
    agencyUrl: "https://www.arpamolise.it/meteo/",
    humidityBias: 3,
    soilMoistureBias: 2,
    rainBias: 1.03,
  },
  campania: {
    agency: "ARPA Campania",
    agencyUrl: "https://www.arpacampania.it/meteo/",
    humidityBias: 2,
    soilMoistureBias: 1,
    rainBias: 0.98,
  },
  basilicata: {
    agency: "ARPA Basilicata",
    agencyUrl: "https://www.arpa.basilicata.it/meteo/",
    humidityBias: 3,
    soilMoistureBias: 2,
    rainBias: 1.04,
  },
};

export function getRegionalAgrometeo(region: FungalZone["region"]) {
  return REGIONAL_AGROMETEO[region];
}
