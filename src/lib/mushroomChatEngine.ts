import type { FungalZone, MapHotspot, MushroomSpecies } from "./types";
import type { GeoPoint } from "./geoUtils";
import { distanceFromPoint } from "./geoUtils";
import { BENEVENTO } from "./benevento";
import {
  addDaysISO,
  formatDateLabel,
  todayISO,
} from "./dateUtils";
import { getSpeciesLabel } from "./predictionEngine";
import { type ProbabilityLevel } from "./mapUtils";
import { formatHourRange, type HourRange } from "./timeRange";
import { getRegionalStatusForZone } from "./funghimagazineData";
import type { SearchCriteria } from "@/components/AdvancedSearchDrawer";
import {
  collectChatResultsFromZones,
  type ChatZoneResult,
} from "./chatZoneResults";

export type { ChatZoneResult };

export interface ParsedMushroomQuery {
  species: MushroomSpecies | "all";
  date: string;
  dateLabel: string;
  rangeKm: number | null;
  originQuery: string | null;
  compareDays: boolean;
  minScore: number;
  intent: "find" | "compare" | "help" | "best";
}

export interface MushroomChatAnswer {
  text: string;
  results: ChatZoneResult[];
  parsed: ParsedMushroomQuery;
  originUsed: GeoPoint;
  rangeUsed: number;
}

export interface MushroomChatContext {
  liveZones: FungalZone[];
  hotspots: MapHotspot[];
  criteria: SearchCriteria;
  defaultRangeKm: number;
  lastUpdate: string | null;
  liveData: boolean;
}

const SPECIES_ALIASES: { species: MushroomSpecies; patterns: RegExp[] }[] = [
  {
    species: "estatino",
    patterns: [
      /estatin/i,
      /porcin[oi]?\s+estiv/i,
      /aestivalis/i,
      /boletus\s+aest/i,
      /porcini?\s+d['']?estate/i,
      /quelli?\s+d['']?estate/i,
    ],
  },
  {
    species: "porcino",
    patterns: [
      /porcin/i,
      /boletus\s+edulis/i,
      /penny\s+bun/i,
      /fungh[io]\s+(?:bianch[io]|gross[io]|buon[io])/i,
      /(?:bianch[io]|gross[io])\s+(?:sotto|al)\s+(?:faggio|castagno|bosco)/i,
      /barret(?:ta|te)?\s+(?:di\s+)?porcino/i,
    ],
  },
  {
    species: "galletto",
    patterns: [
      /gallett/i,
      /finferl/i,
      /cantarell/i,
      /cantharellus/i,
      /gallinell/i,
      /giall[io]/i,
      /arancio/i,
      /gob(?:bett|bet)/i,
    ],
  },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function parseMushroomQuestion(
  text: string,
  defaultRangeKm: number
): ParsedMushroomQuery {
  const raw = text.trim();
  const lower = normalize(raw);

  if (
    /^(ciao|salve|help|aiuto|come funziona|cosa puoi fare)/.test(lower)
  ) {
    return {
      species: "all",
      date: todayISO(),
      dateLabel: "Oggi",
      rangeKm: null,
      originQuery: null,
      compareDays: false,
      minScore: 28,
      intent: "help",
    };
  }

  let species: MushroomSpecies | "all" = "all";
  for (const entry of SPECIES_ALIASES) {
    if (entry.patterns.some((p) => p.test(raw))) {
      species = entry.species;
      break;
    }
  }

  const today = todayISO();
  let date = today;
  let dateLabel = formatDateLabel(today);
  const compareDays =
    /oggi\s+e\s+domani|meglio\s+oggi|confronta|differenza/.test(lower);

  if (/dopodomani/.test(lower)) {
    date = addDaysISO(today, 2);
    dateLabel = formatDateLabel(date);
  } else if (/domani/.test(lower) && !/dopodomani/.test(lower)) {
    date = addDaysISO(today, 1);
    dateLabel = formatDateLabel(date);
  } else if (/oggi|adesso|ora|stamattina|questa mattina/.test(lower)) {
    date = today;
    dateLabel = formatDateLabel(today);
  }

  let rangeKm: number | null = null;
  const kmMatch =
    lower.match(
      /(?:raggio\s+(?:di\s+)?|entro\s+|a\s+|nel\s+raggio\s+di\s+|cerca\s+entro\s+)(\d+)\s*(?:km|chilometri)/i
    ) ?? lower.match(/(\d+)\s*km/i);
  if (kmMatch) rangeKm = Number(kmMatch[1]);

  let originQuery: string | null = null;
  if (
    /da te|vicino a me|dalla mia posizione|partendo da me|dove sono|intorno a me|attorno a me|dalla mia zona/.test(
      lower
    )
  ) {
    originQuery = null;
  } else {
    const originMatch = raw.match(
      /(?:da|partendo da|vicino a|intorno a|attorno a|verso)\s+([A-Za-zÀ-ÿ\s'-]{2,40}?)(?:\?|,|$|\s+(?:nel|entro|raggio|oggi|domani|dopodomani|trovo|nascer|cerca))/i
    );
    if (originMatch) {
      originQuery = originMatch[1].trim();
    } else if (/benevento/.test(lower)) {
      originQuery = "Benevento";
    }
  }

  const intent: ParsedMushroomQuery["intent"] =
    compareDays
      ? "compare"
      : /miglior|top|consigli|dove andare|zona migliore|cerca entro/.test(lower)
        ? "best"
        : /cerca|trova|trovo|nascono|nascer|dove\s+(?:ci\s+sono|vado|andare)/.test(
              lower
            )
          ? "find"
          : "find";

  const minScore =
    /alta probabilit|solo alta|sopra\s*80/.test(lower)
      ? 80
      : /media|discreta/.test(lower)
        ? 40
        : 28;

  return {
    species,
    date,
    dateLabel,
    rangeKm: rangeKm ?? defaultRangeKm,
    originQuery,
    compareDays,
    minScore,
    intent,
  };
}

export async function resolveOriginFromQuery(
  originQuery: string | null,
  fallback: GeoPoint
): Promise<GeoPoint> {
  if (!originQuery) return fallback;

  const norm = normalize(originQuery);
  if (norm.includes("benevento")) return BENEVENTO;

  try {
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(originQuery)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      const first = data.results?.[0];
      if (first) {
        return { name: first.name, lat: first.lat, lng: first.lng };
      }
    }
  } catch {
    /* fallback */
  }
  return fallback;
}

function enrichZonesFromOrigin(
  zones: FungalZone[],
  origin: GeoPoint
): FungalZone[] {
  return zones.map((zone) => {
    const dist = distanceFromPoint(origin, zone.parkingLat, zone.parkingLng);
    return {
      ...zone,
      kmFromBenevento: dist.roadKm,
      driveMinutesFromBenevento: dist.driveMinutes,
    };
  });
}

function filterZones(
  zones: FungalZone[],
  criteria: SearchCriteria,
  rangeKm: number
): FungalZone[] {
  return zones
    .filter((z) => criteria.includedRegions.includes(z.region))
    .filter((z) => z.kmFromBenevento <= rangeKm);
}

function collectZoneResults(
  zones: FungalZone[],
  species: MushroomSpecies | "all",
  hourRange: HourRange,
  date: string,
  minScore: number,
  limit = 8
): ChatZoneResult[] {
  return collectChatResultsFromZones(
    zones,
    species,
    hourRange,
    date,
    minScore,
    limit
  );
}

function levelLabel(level: ProbabilityLevel): string {
  if (level === "dorato") return "Eccezionale / dorato (95–100%)";
  if (level === "alta") return "Alta (80–94%)";
  if (level === "media") return "Media (40–79%)";
  return "Bassa (<40%)";
}

function buildHelpAnswer(): MushroomChatAnswer {
  return {
    text: `Sono l'assistente **MushroomRadar** 🍄. Posso rispondere usando meteo live (Open-Meteo + ARPA) e previsioni per oggi/domani.

**Esempi:**
• "Dove trovo gli estatini nel raggio di 20 km da Benevento?"
• "Dove nasceranno i porcini domani?"
• "Migliori zone per finferli oggi da Campobasso"
• "Confronta oggi e domani per il porcino"

Per ogni zona ti do **percentuale**, **distanza**, **coordinate**, **parcheggio** e link **Google Maps**.`,
    results: [],
    parsed: {
      species: "all",
      date: todayISO(),
      dateLabel: "Oggi",
      rangeKm: null,
      originQuery: null,
      compareDays: false,
      minScore: 28,
      intent: "help",
    },
    originUsed: BENEVENTO,
    rangeUsed: 0,
  };
}

function formatResultLine(r: ChatZoneResult, index: number): string {
  return `**${index + 1}. ${r.zoneName}** — ${r.speciesLabel} **${r.score}%** (${levelLabel(r.level)})
   📍 ${r.km} km · ⏱ ${r.driveMinutes} min
   🌲 ${r.altitude} m · ${r.forestType}
   🅿️ ${r.parkingLabel}: ${r.coords}
   🗺 Area raccolta: ${r.foragingCoords}`;
}

export async function answerMushroomQuestion(
  question: string,
  context: MushroomChatContext
): Promise<MushroomChatAnswer> {
  const parsed = parseMushroomQuestion(question, context.defaultRangeKm);

  if (parsed.intent === "help") {
    return buildHelpAnswer();
  }

  const origin = await resolveOriginFromQuery(
    parsed.originQuery,
    context.criteria.origin
  );
  const rangeUsed = parsed.rangeKm ?? context.defaultRangeKm;
  const hourRange = context.criteria.hourRange;

  const enriched = enrichZonesFromOrigin(context.liveZones, origin);
  const zones = filterZones(enriched, context.criteria, rangeUsed);

  if (zones.length === 0) {
    return {
      text: `Non ho trovato zone nel raggio di **${rangeUsed} km** da **${origin.name}** con i filtri regione attuali. Prova ad allargare il raggio o includere più regioni nella ricerca avanzata.`,
      results: [],
      parsed,
      originUsed: origin,
      rangeUsed,
    };
  }

  if (parsed.compareDays || parsed.intent === "compare") {
    const today = todayISO();
    const tomorrow = addDaysISO(today, 1);
    const sp = parsed.species === "all" ? "porcino" : parsed.species;

    const todayResults = collectZoneResults(
      zones,
      sp,
      hourRange,
      today,
      parsed.minScore,
      5
    );
    const tomorrowResults = collectZoneResults(
      zones,
      sp,
      hourRange,
      tomorrow,
      parsed.minScore,
      5
    );

    const bestToday = todayResults[0];
    const bestTomorrow = tomorrowResults[0];
    const delta =
      (bestTomorrow?.score ?? 0) - (bestToday?.score ?? 0);

    let text = `**Confronto ${getSpeciesLabel(sp)}** — da **${origin.name}** (${rangeUsed} km), ${formatHourRange(hourRange)}:\n\n`;
    text += `**Oggi:** ${bestToday ? `${bestToday.zoneName} ${bestToday.score}%` : "nessuna zona attiva"}\n`;
    text += `**Domani:** ${bestTomorrow ? `${bestTomorrow.zoneName} ${bestTomorrow.score}%` : "nessuna zona attiva"}\n\n`;

    if (delta > 5) {
      text += `📈 **Domani migliora** (+${delta}% sulla zona top).\n\n`;
    } else if (delta < -5) {
      text += `📉 Oggi è leggermente meglio (${Math.abs(delta)}% in più).\n\n`;
    } else {
      text += `Condizioni simili tra oggi e domani.\n\n`;
    }

    if (tomorrowResults.length > 0) {
      text += `**Zone domani (${getSpeciesLabel(sp)}):**\n`;
      tomorrowResults.forEach((r, i) => {
        text += formatResultLine(r, i) + "\n";
      });
    }

    return {
      text,
      results: tomorrowResults.length > 0 ? tomorrowResults : todayResults,
      parsed: { ...parsed, date: tomorrow, dateLabel: "Domani" },
      originUsed: origin,
      rangeUsed,
    };
  }

  const results = collectZoneResults(
    zones,
    parsed.species,
    hourRange,
    parsed.date,
    parsed.minScore,
    parsed.intent === "best" ? 3 : 8
  );

  const speciesLabel =
    parsed.species === "all"
      ? "tutte le specie"
      : getSpeciesLabel(parsed.species);

  const liveNote = context.liveData && context.lastUpdate
    ? `\n\n_Meteo live aggiornato ${new Date(context.lastUpdate).toLocaleString("it-IT")}_`
    : "\n\n_Usando ultimi dati meteo disponibili_";

  if (results.length === 0) {
    const fmHint =
      parsed.species !== "all"
        ? getRegionalStatusForZone(zones[0]?.region ?? "sannio")
        : undefined;

    let text = `Per **${parsed.dateLabel}** non ho zone con probabilità sufficiente per **${speciesLabel}** entro **${rangeUsed} km** da **${origin.name}** (${formatHourRange(hourRange)}).`;
    if (fmHint?.porciniFrom && parsed.species === "porcino") {
      text += `\n\n📡 Funghimagazine: porcini attesi ${fmHint.porciniFrom}.`;
    }
    text += `\n\nProva: allarga il raggio, cambia fascia oraria (06–10) o chiedi "domani".${liveNote}`;

    return { text, results: [], parsed, originUsed: origin, rangeUsed };
  }

  let text = `**${parsed.dateLabel}** · **${speciesLabel}** · da **${origin.name}** · raggio **${rangeUsed} km** · ${formatHourRange(hourRange)}\n\n`;
  text += `Trovate **${results.length}** zone attive:\n\n`;

  results.forEach((r, i) => {
    text += formatResultLine(r, i) + "\n";
  });

  if (parsed.intent === "best" && results[0]) {
    const top = results[0];
    text += `\n🏆 **Consiglio:** vai a **${top.zoneName}** (${top.score}% ${top.speciesLabel}, ${top.km} km).`;
  }

  text += liveNote;

  return { text, results, parsed, originUsed: origin, rangeUsed };
}

export const SUGGESTED_CHAT_PROMPTS = [
  "Cerca entro 60 km da te porcini",
  "Cerca entro 60 km da te estatini",
  "Cerca entro 60 km da te galletti",
  "Dove trovo gli estatini nel raggio di 20 km da Benevento?",
  "Dove nasceranno i porcini domani?",
  "Migliori zone per finferli oggi",
];
