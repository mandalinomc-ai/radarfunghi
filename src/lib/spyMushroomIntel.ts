import type { DailyWeatherHistory } from "./openMeteoHistory";
import { avgHumidityLastDays, sumRainLastDays } from "./openMeteoHistory";

export interface SpyMushroomProfile {
  id: string;
  commonName: string;
  scientificName: string;
  indicates: string;
  premiumTargets: string[];
  wikipediaUrl: string;
  imageUrl: string;
}

export const SPY_MUSHROOMS: SpyMushroomProfile[] = [
  {
    id: "clitopilus-prunulus",
    commonName: "Spia del porcino",
    scientificName: "Clitopilus prunulus",
    indicates:
      "Compare 10–20 giorni prima dei porcini in faggete umide. Micelio in simbiosi con latifoglie.",
    premiumTargets: ["Porcino (Boletus edulis)", "Porcino estivo"],
    wikipediaUrl: "https://it.wikipedia.org/wiki/Clitopilus_prunulus",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Clitopilus_prunulus.jpg/320px-Clitopilus_prunulus.jpg",
  },
  {
    id: "amanita-muscaria",
    commonName: "Amanita muscaria",
    scientificName: "Amanita muscaria",
    indicates:
      "Segnala boschi freschi e acidi con betulle e conifere. Spesso precede l'ondata dei boletti.",
    premiumTargets: ["Porcino", "Boleto rosso (B. erythropus)"],
    wikipediaUrl: "https://it.wikipedia.org/wiki/Amanita_muscaria",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Amanita_muscaria_3_vliegenzwammen_op_rij.jpg/320px-Amanita_muscaria_3_vliegenzwammen_op_rij.jpg",
  },
  {
    id: "amanita-rubescens",
    commonName: "Coccola / Amanita rubescens",
    scientificName: "Amanita rubescens",
    indicates:
      "Indica suolo calcareo umido sotto castagni e querce. Buon indicatore di finestra porcini autunnali.",
    premiumTargets: ["Porcino", "Galletto"],
    wikipediaUrl: "https://it.wikipedia.org/wiki/Amanita_rubescens",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Amanita_rubescens.jpg/320px-Amanita_rubescens.jpg",
  },
  {
    id: "cortinarius",
    commonName: "Cortinarius (generale)",
    scientificName: "Cortinarius sp.",
    indicates:
      "Numerosi cortinari compaiono con l'umidità del suolo in ripresa. Spia generica di fruttificazione imminente.",
    premiumTargets: ["Porcino", "Finferli"],
    wikipediaUrl: "https://it.wikipedia.org/wiki/Cortinarius",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Cortinarius_violaceus.jpg/320px-Cortinarius_violaceus.jpg",
  },
  {
    id: "boletus-erythropus",
    commonName: "Boleto rosso",
    scientificName: "Boletus erythropus",
    indicates:
      "Specie pregia ma anche spia: la sua comparsa segnala condizioni ottimali per altri boletti nella stessa macchia.",
    premiumTargets: ["Porcino", "Porcino estivo"],
    wikipediaUrl: "https://it.wikipedia.org/wiki/Boletus_erythropus",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9a/Boletus_erythropus_1.jpg/320px-Boletus_erythropus_1.jpg",
  },
];

export interface SpyPredictionHorizon {
  days: 10 | 14 | 20;
  title: string;
  forecast: string;
  confidence: "alta" | "media" | "bassa";
}

export interface SpyPredictionReport {
  recognized: SpyMushroomProfile;
  scannedAt: string;
  rain14d: number;
  rain30d: number;
  avgHumidity14d: number;
  optimism: "ottimo" | "buono" | "moderato" | "scarso";
  horizons: SpyPredictionHorizon[];
  note: string;
}

function optimismFromWeather(rain14: number, humidity14: number): SpyPredictionReport["optimism"] {
  if (rain14 >= 35 && humidity14 >= 72) return "ottimo";
  if (rain14 >= 20 && humidity14 >= 65) return "buono";
  if (rain14 >= 10 || humidity14 >= 58) return "moderato";
  return "scarso";
}

function buildHorizonText(
  days: 10 | 14 | 20,
  spy: SpyMushroomProfile,
  optimism: SpyPredictionReport["optimism"],
  rain14: number,
  humidity14: number
): { forecast: string; confidence: SpyPredictionHorizon["confidence"] } {
  const targets = spy.premiumTargets.join(", ");

  if (days === 10) {
    if (optimism === "ottimo" || optimism === "buono") {
      return {
        forecast: `Inizio incubazione micelio e primordi per ${targets}. Pioggia recente (${rain14} mm/14 gg) favorisce la ripresa.`,
        confidence: optimism === "ottimo" ? "alta" : "media",
      };
    }
    return {
      forecast: `Possibile avvio lento dei primordi di ${targets}. Serve altra pioggia leggera nelle prossime 48–72 h.`,
      confidence: "bassa",
    };
  }

  if (days === 14) {
    if (optimism === "ottimo") {
      return {
        forecast: `Picco di crescita stimato per ${targets}. Umidità media ${humidity14}% e comparsa di ${spy.commonName} allineano la finestra.`,
        confidence: "alta",
      };
    }
    if (optimism === "buono") {
      return {
        forecast: `Finestra favorevole per ${targets} in quota ombrosa. Cerca sotto ${spy.premiumTargets[0] ?? "latifoglie"}.`,
        confidence: "media",
      };
    }
    return {
      forecast: `Crescita discontinua per ${targets}. Monitora zone con muschio e suolo ancora umido.`,
      confidence: "bassa",
    };
  }

  // 20 days
  if (optimism === "ottimo" || optimism === "buono") {
    return {
      forecast:
        humidity14 >= 68
          ? `Mantenimento della buttata probabile se non arriva vento secco prolungato.`
          : `Esaurimento graduale della buttata — ultimi ritrovamenti sparsi.`,
      confidence: "media",
    };
  }
  return {
    forecast: `Esaurimento anticipato della fruttificazione. Ritorna dopo nuove precipitazioni.`,
    confidence: "bassa",
  };
}

export function buildSpyPredictionReport(
  history: DailyWeatherHistory,
  recognized: SpyMushroomProfile
): SpyPredictionReport {
  const rain14d = sumRainLastDays(history, 14);
  const rain30d = sumRainLastDays(history, 30);
  const avgHumidity14d = avgHumidityLastDays(history, 14);
  const optimism = optimismFromWeather(rain14d, avgHumidity14d);

  const horizons: SpyPredictionHorizon[] = ([10, 14, 20] as const).map((days) => {
    const { forecast, confidence } = buildHorizonText(
      days,
      recognized,
      optimism,
      rain14d,
      avgHumidity14d
    );
    return {
      days,
      title:
        days === 10
          ? "Prossimi 10 giorni"
          : days === 14
            ? "Prossimi 14 giorni"
            : "Prossimi 20 giorni",
      forecast,
      confidence,
    };
  });

  return {
    recognized,
    scannedAt: new Date().toISOString(),
    rain14d,
    rain30d,
    avgHumidity14d,
    optimism,
    horizons,
    note: `Analisi basata su dati Open-Meteo LIVE (${history.startDate} → ${history.endDate}). La comparsa di ${recognized.commonName} (${recognized.scientificName}) suggerisce: ${recognized.indicates}`,
  };
}

/** Simula riconoscimento da hash del file — deterministico ma variabile */
export function simulateSpyRecognition(file: File): SpyMushroomProfile {
  const seed =
    file.name.length * 7 +
    file.size +
    file.lastModified % 1000;
  const idx = seed % SPY_MUSHROOMS.length;
  return SPY_MUSHROOMS[idx]!;
}

export const SPY_MUSHROOM_GUIDE_INTRO = `I funghi spia sono specie che compaiono prima o insieme ai funghi più pregiati (porcini, finferli). Osservarli nel bosco aiuta a capire se il micelio è attivo e se le condizioni meteo degli ultimi giorni favoriscono una buttata nei prossimi 10–20 giorni.`;
