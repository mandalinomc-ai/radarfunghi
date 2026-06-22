import type { MapHotspot, MushroomSpecies } from "./types";
import {
  FM_NATIONAL_REPORT,
  FM_SOURCE,
  FM_WEATHER_LIVE,
  getRegionalStatusForZone,
  type FMTrafficLight,
} from "./funghimagazineData";
import { dayOffsetFromToday, formatDateLabel, isPastItalianDateRange } from "./dateUtils";
import type { GeoPoint } from "./geoUtils";
import { formatDriveFromOrigin } from "./geoUtils";
import type { HourRange } from "./timeRange";
import type { ServiceTier } from "./tierUtils";
import { getHotspotDisplayCoordinates } from "./zoneCoordinateService";
import {
  getIdChecklist,
  getLookalikesForSpecies,
  getSafetyWarningsForSpecies,
} from "./safetyEducation";
import { getHabitatRule } from "./speciesHabitat";
import { formatRegulationSummary } from "./regionalRegulations";
import {
  getSpeciesLabel,
  getSpeciesScientific,
} from "./predictionEngine";

export interface YieldEstimate {
  species: MushroomSpecies;
  label: string;
  min: number;
  max: number;
  unit: string;
  confidence: "alta" | "media" | "bassa";
  note: string;
}

export interface RoadmapStep {
  step: number;
  time: string;
  title: string;
  description: string;
  icon: string;
}

export interface BeginnerRoadmap {
  generatedAt: string;
  recommendedZone: string;
  region: string;
  score: number;
  trafficLight: FMTrafficLight;
  fmSummary: string;
  simpleVerdict: string;
  departureTime: string;
  arrivalTime: string;
  collectionWindow: string;
  driveMinutes: number;
  walkMinutes: number;
  coordinates: string;
  parkingCoordinates: string;
  forestType: string;
  altitude: number;
  yields: YieldEstimate[];
  totalExpected: string;
  equipment: string[];
  warnings: string[];
  roadmap: RoadmapStep[];
  mapsLink: string;
  fmSource: string;
  fmSourceUrl: string;
  weatherNote: string;
}

const DAY_LABELS = ["Oggi", "Domani", "Dopodomani", "Tra 3 giorni", "Tra 4 giorni"];

function formatTime(hour: number, minute = 0): string {
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}


function estimateWalkMinutes(altitude: number): number {
  if (altitude < 800) return 15;
  if (altitude < 1000) return 25;
  return 35;
}

export function estimateYields(
  hotspot: MapHotspot,
  selectedDate: string
): YieldEstimate[] {
  const { zone, predictions, activeScore } = hotspot;
  const fmStatus = getRegionalStatusForZone(zone.region, zone.id);
  const soilCold = fmStatus?.soilStatus === "freddo";
  const beforePorciniDate =
    fmStatus?.porciniFrom != null &&
    !isPastItalianDateRange(fmStatus.porciniFrom, selectedDate);

  const yields: YieldEstimate[] = [];

  for (const pred of predictions) {
    const base = pred.score / 100;
    let min = 0;
    let max = 0;
    let confidence: YieldEstimate["confidence"] = "bassa";
    let note = "";

    if (pred.species === "galletto") {
      min = Math.round(base * 8);
      max = Math.round(base * 20);
      if (min < 2 && base > 0.4) min = 2;
      confidence = pred.score >= 65 ? "alta" : pred.score >= 45 ? "media" : "bassa";
      note =
        fmStatus?.speciesActive.includes("Galletto (Finferlo)") ||
        fmStatus?.speciesActive.includes("Galletto")
          ? "FM conferma: Finferli in ripresa con le piogge recenti"
          : "Specie a rapida fruttificazione post-pioggia";
    } else if (pred.species === "estatino") {
      min = Math.round(base * 3);
      max = Math.round(base * 8);
      confidence = pred.score >= 60 ? "media" : "bassa";
      note = "Cerca in radure esposte a Est, sotto Castagno";
    } else if (pred.species === "porcino") {
      if (soilCold || beforePorciniDate) {
        min = 0;
        max = pred.score >= 70 ? 2 : 1;
        confidence = "bassa";
        note = `FM: suoli freddi al Matese — Porcini attesi dal ${fmStatus?.porciniFrom ?? "10-12 giugno"}`;
      } else {
        min = Math.round(base * 2);
        max = Math.round(base * 6);
        confidence = pred.score >= 70 ? "media" : "bassa";
        note = "Cerca in faggeta, sotto muschi, vicino a Faggio e Abete";
      }
    }

    if (max > 0 || pred.score >= 35) {
      yields.push({
        species: pred.species,
        label: getSpeciesLabel(pred.species),
        min,
        max,
        unit: pred.species === "galletto" ? "finferli" : "esemplari",
        confidence,
        note,
      });
    }
  }

  if (yields.length === 0 && activeScore >= 30) {
    yields.push({
      species: "galletto",
      label: "Galletto",
      min: 1,
      max: 5,
      unit: "finferli",
      confidence: "bassa",
      note: "Possibili ritrovamenti sparsi — gestione aspettative prudenti",
    });
  }

  return yields;
}

function buildSimpleVerdict(
  hotspot: MapHotspot,
  selectedDate: string
): string {
  const fm = getRegionalStatusForZone(hotspot.zone.region, hotspot.zone.id);
  const day = formatDateLabel(selectedDate);

  if (hotspot.activeScore >= 75) {
    return `Sì, ${day} è un buon momento! Vai a ${hotspot.zone.name}: troverai probabilmente funghi, soprattutto ${getSpeciesLabel(hotspot.activeSpecies)}.`;
  }
  if (hotspot.activeScore >= 55) {
    return `${day} puoi provare ${hotspot.zone.name}. Non è il massimo, ma con pazienza dovresti trovare qualcosa (soprattutto Finferli).`;
  }
  if (fm?.soilStatus === "freddo") {
    return `Per ora i boschi di ${hotspot.zone.name} sono ancora freddi (dice Funghimagazine). Meglio puntare ai Finferli e tornare per i Porcini dal ${fm.porciniFrom ?? "10-12 giugno"}.`;
  }
  return `${day} le possibilità sono moderate. Se sei alle prime armi, segui la roadmap qui sotto e non scoraggiarti se trovi poco.`;
}

export function generateBeginnerRoadmap(
  hotspots: MapHotspot[],
  selectedDate: string,
  _hourRange: HourRange,
  origin: GeoPoint,
  tier: ServiceTier = "free",
  targetSpecies?: MushroomSpecies[]
): BeginnerRoadmap | null {
  let viable = hotspots
    .filter((h) => h.activeScore >= 28)
    .sort((a, b) => b.activeScore - a.activeScore);

  if (targetSpecies && targetSpecies.length > 0) {
    const speciesRanked = [...hotspots]
      .map((h) => {
        const speciesScores = targetSpecies.map((sp) => {
          const pred = h.predictions.find((p) => p.species === sp);
          return pred?.score ?? 0;
        });
        const bestSpeciesScore = Math.max(...speciesScores, 0);
        const matchesActive = targetSpecies.includes(h.activeSpecies);
        return {
          hotspot: h,
          rank: bestSpeciesScore + (matchesActive ? 8 : 0),
        };
      })
      .filter((x) => x.rank >= 28)
      .sort((a, b) => b.rank - a.rank);

    if (speciesRanked.length > 0) {
      viable = speciesRanked.map((x) => x.hotspot);
    } else {
      viable = viable.filter((h) =>
        targetSpecies.some(
          (sp) =>
            h.zone.species.includes(sp) ||
            h.predictions.some((p) => p.species === sp && p.score >= 25)
        )
      );
    }
  }

  if (viable.length === 0) return null;

  const best = viable[0];
  const { zone } = best;
  const fmStatus = getRegionalStatusForZone(zone.region, zone.id);
  const driveMin = zone.driveMinutesFromBenevento;
  const walkMin = estimateWalkMinutes(zone.altitude);

  const collectionStart = zone.collectionWindow.startHour;
  const collectionStartMin = zone.collectionWindow.startMinute;
  const arrivalHour = collectionStart;
  const arrivalMin = collectionStartMin;
  const departureTotalMin = arrivalHour * 60 + arrivalMin - driveMin - walkMin - 15;
  const depHour = Math.max(4, Math.floor(departureTotalMin / 60));
  const depMin = Math.max(0, departureTotalMin % 60);

  const yields = estimateYields(best, selectedDate).filter(
    (y) =>
      !targetSpecies ||
      targetSpecies.length === 0 ||
      targetSpecies.includes(y.species)
  );
  const totalExpected = yields
    .map((y) => {
      if (y.min === 0 && y.max <= 1)
        return `0-1 ${y.label.toLowerCase()}`;
      return `${y.min}-${y.max} ${y.unit} di ${y.label.toLowerCase()}`;
    })
    .join(", ");

  const trafficLight = fmStatus?.trafficLight ?? "giallo";
  const displayCoords = getHotspotDisplayCoordinates(
    { zone, predictions: best.predictions, activeScore: best.activeScore, activeSpecies: best.activeSpecies },
    tier
  );

  const roadmap: RoadmapStep[] = [
    {
      step: 1,
      time: formatTime(depHour, depMin),
      title: "Parti da casa",
      description: `Metti in auto sacco di carta o cesto traspirante, coltello, acqua e giacca. Parti da ${origin.name} e imposta il navigatore verso il parcheggio: ${displayCoords.parking}. Tempo di viaggio: ${formatDriveFromOrigin(origin.name, driveMin)}.`,
      icon: "🚗",
    },
    {
      step: 2,
      time: formatTime(depHour + Math.floor(driveMin / 60), (depMin + driveMin) % 60),
      title: "Parcheggia al punto di accesso",
      description: `Fermati al parcheggio più vicino al bosco. Non entrare con l'auto nei sentieri sterrati. Da qui inizia il sentiero verso ${zone.name} (${zone.altitude}m).`,
      icon: "🅿️",
    },
    {
      step: 3,
      time: formatTime(arrivalHour, arrivalMin),
      title: "Entra nel bosco",
      description: `Cammina ~${walkMin} minuti fino alla zona indicata. Cerca in: ${zone.forestType}. Esposizione ${zone.exposure.toUpperCase()}. ${fmStatus?.summary ?? ""}`,
      icon: "🌲",
    },
    {
      step: 4,
      time: `${formatTime(arrivalHour, arrivalMin)} – ${formatTime(zone.collectionWindow.endHour, zone.collectionWindow.endMinute)}`,
      title: "Cerca i funghi",
      description: yields
        .map(
          (y) =>
            `${y.label}: cerca ${y.min}-${y.max} ${y.unit}. ${y.note}`
        )
        .join(" "),
      icon: "🍄",
    },
    {
      step: 5,
      time: formatTime(zone.collectionWindow.endHour, zone.collectionWindow.endMinute),
      title: "Torna al parcheggio",
      description:
        "Raccogli solo quelli che riconosci con certezza. Taglia il gambo con il coltello, non strappare. Lascia i piccoli e quelli troppo maturi.",
      icon: "🔙",
    },
  ];

  const warnings = [
    ...getSafetyWarningsForSpecies(best.activeSpecies).slice(0, 2),
    formatRegulationSummary(zone.region),
    fmStatus?.soilStatus === "freddo"
      ? `Funghimagazine: suoli freddi in zona — porcini potrebbero essere assenti.`
      : "Porta scarpe da trekking e abiti a strati: al mattino fa fresco in bosco.",
    `Previsioni FM ${FM_WEATHER_LIVE.date}: ${FM_WEATHER_LIVE.headline}`,
  ];

  return {
    generatedAt: new Date().toISOString(),
    recommendedZone: zone.name,
    region: zone.region,
    score: best.activeScore,
    trafficLight,
    fmSummary: fmStatus?.summary ?? FM_NATIONAL_REPORT.southItalyNote,
    simpleVerdict: buildSimpleVerdict(best, selectedDate),
    departureTime: formatTime(depHour, depMin),
    arrivalTime: formatTime(arrivalHour, arrivalMin),
    collectionWindow: zone.collectionWindow.label,
    driveMinutes: driveMin,
    walkMinutes: walkMin,
    coordinates: displayCoords.foraging,
    parkingCoordinates: displayCoords.parking,
    forestType: zone.forestType,
    altitude: zone.altitude,
    yields,
    totalExpected: totalExpected || "1-3 finferli (stima prudente)",
    equipment: [
      "Cesto di vimini o sacco di carta (mai sacchetti di plastica)",
      "Coltello da funghi",
      "Acqua (1-2 litri)",
      "Giacca leggera impermeabile",
      "Scarpe da trekking",
      "Guida ai funghi o app di riconoscimento",
      "Telefono carico con GPS",
    ],
    warnings,
    roadmap,
    mapsLink: displayCoords.mapsLinkParking,
    fmSource: FM_SOURCE.name,
    fmSourceUrl: FM_SOURCE.articleUrl,
    weatherNote: FM_WEATHER_LIVE.today,
  };
}

export function getBestHotspot(hotspots: MapHotspot[]): MapHotspot | null {
  const sorted = [...hotspots].sort((a, b) => b.activeScore - a.activeScore);
  return sorted[0] ?? null;
}

export function getSpeciesGuideText(species: MushroomSpecies): string {
  const rule = getHabitatRule(species);
  const lookalike = getLookalikesForSpecies(species)[0];
  const checklist = getIdChecklist(species)
    .slice(0, 3)
    .map((c) => c.step)
    .join(", ");

  let text = `${getSpeciesLabel(species)} (${getSpeciesScientific(species)}). `;
  text += rule.searchTips[0] + " ";
  text += `Cerca: ${rule.substrateHints[0]}. `;
  text += `Verifica: ${checklist}. `;
  if (lookalike) {
    text += `Attenzione confusione con ${lookalike.toxicName}. `;
  }
  text += "Controllo ASL obbligatorio prima del consumo.";
  return text;
}
