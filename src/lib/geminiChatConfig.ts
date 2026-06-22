import { GoogleGenAI, Type, type GenerateContentResponse } from "@google/genai";
import type { MapHotspot, MushroomSpecies } from "./types";
import { getSpeciesLabel } from "./predictionEngine";
import { getProbabilityLevel } from "./mapUtils";
import { formatDateLabel, todayISO } from "./dateUtils";
import {
  CAMPANIA_SOCIAL_FORAGING_TRENDS,
  isSocialTrendActiveForRegion,
  type CampaniaSocialTrend,
} from "./campaniaSocialTrends";
import { formatSocialTrendsForGeminiPrompt } from "./socialEvidence";
import { EXPERT_TIPS, getGlobalExpertTips } from "./expertTips";
import { UNIVERSAL_SAFETY_RULES } from "./safetyEducation";
import { formatCertifiedSourcesForGemini, formatVerifiedSourcesForGemini, CERTIFIED_SOURCES } from "./certifiedSources";
import { formatYoutubeSourcesForGemini } from "./youtubeSources";
import { getCachedVerifications } from "./sourceVerificationCache";
import type { MastroHotspotPayload } from "./mastroHotspotMapper";
import { getParkingLabel } from "./chatZoneResults";

import {
  generateMastroViaRest,
  MASTRO_GEMINI_MODEL_FALLBACKS,
} from "./mastroGeminiRest";

/** Modello Gemini per Mastro Fungaiolo — gemini-2.5-flash compatibile con chiavi AQ. */
export const GEMINI_CHAT_MODEL =
  process.env.GEMINI_CHAT_MODEL ?? "gemini-2.5-flash";
export const GEMINI_API_KEY_ENV = "GEMINI_API_KEY";

/** Snapshot serializzabile per Server Actions (da MapHotspot[]) */
export interface GeminiHotspotSnapshot {
  zoneId: string;
  zoneName: string;
  region: string;
  altitude: number;
  forestType: string;
  exposure: string;
  activeScore: number;
  activeSpecies: MushroomSpecies;
  activeSpeciesLabel: string;
  probabilityLevel: "alta" | "media" | "bassa";
  kmFromOrigin: number;
  driveMinutesFromOrigin: number;
  parkingLat: number;
  parkingLng: number;
  parkingLabel: string;
  foragingLat: number;
  foragingLng: number;
  predictions: Array<{
    species: MushroomSpecies;
    label: string;
    score: number;
    level: "alta" | "media" | "bassa";
  }>;
}

export interface GeminiChatContextMeta {
  originName: string;
  selectedDate: string;
  hourRangeLabel: string;
  rangeKm: number;
  liveData: boolean;
  lastUpdate: string | null;
  speciesFilter: MushroomSpecies | "all";
}

export type { CampaniaSocialTrend };
export { CAMPANIA_SOCIAL_FORAGING_TRENDS };

export type { MastroChatResponse } from "./mastroTypes";

/** Server Action `chatWithMastro` → `@/app/actions/mastroFungaiolo` (Specifica Master §7) */
import type { MastroChatResponse } from "./mastroTypes";

let cachedClient: GoogleGenAI | null = null;
export function isGeminiChatConfigured(): boolean {
  return Boolean(process.env[GEMINI_API_KEY_ENV]?.trim());
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env[GEMINI_API_KEY_ENV]?.trim();
  if (!apiKey) {
    throw new Error(
      `${GEMINI_API_KEY_ENV} non configurata. Aggiungila in .env.local o su Vercel.`
    );
  }
  if (!cachedClient) {
    cachedClient = new GoogleGenAI({ apiKey });
  }
  return cachedClient;
}

/** Converte MapHotspot[] client → payload serializzabile per Server Action */
export function snapshotHotspotsForGemini(
  hotspots: MapHotspot[]
): GeminiHotspotSnapshot[] {
  return hotspots
    .map((h) => ({
      zoneId: h.zone.id,
      zoneName: h.zone.name,
      region: h.zone.region,
      altitude: h.zone.altitude,
      forestType: h.zone.forestType,
      exposure: h.zone.exposure,
      activeScore: h.activeScore,
      activeSpecies: h.activeSpecies,
      activeSpeciesLabel: getSpeciesLabel(h.activeSpecies),
      probabilityLevel: getProbabilityLevel(h.activeScore),
      kmFromOrigin: h.zone.kmFromBenevento,
      driveMinutesFromOrigin: h.zone.driveMinutesFromBenevento,
      parkingLat: h.zone.parkingLat,
      parkingLng: h.zone.parkingLng,
      parkingLabel: getParkingLabel(h.zone.id, h.zone.name),
      foragingLat: h.zone.lat,
      foragingLng: h.zone.lng,
      predictions: h.predictions.map((p) => ({
        species: p.species,
        label: getSpeciesLabel(p.species),
        score: p.score,
        level: getProbabilityLevel(p.score),
      })),
    }))
    .sort((a, b) => b.activeScore - a.activeScore);
}

function formatHotspotsBlock(hotspots: GeminiHotspotSnapshot[]): string {
  if (hotspots.length === 0) {
    return "NESSUN HOTSPOT NEL RAGGIO/FILTRI ATTUALI. Dillo chiaramente e suggerisci di ampliare km o cambiare giorno/specie.";
  }

  return hotspots
    .slice(0, 25)
    .map((h, i) => {
      const preds = h.predictions
        .map((p) => `${p.label} ${p.score}% (${p.level})`)
        .join("; ");
      return [
        `${i + 1}. ${h.zoneName} [${h.region}]`,
        `   Sprout Score attivo: ${h.activeScore}% (${h.probabilityLevel}) — ${h.activeSpeciesLabel}`,
        `   Quota ${h.altitude}m · ${h.forestType} · esposizione ${h.exposure}`,
        `   Distanza: ${h.kmFromOrigin} km · ~${h.driveMinutesFromOrigin} min`,
        `   Parcheggio (${h.parkingLabel}): ${h.parkingLat.toFixed(5)}, ${h.parkingLng.toFixed(5)}`,
        `   Area raccolta: ${h.foragingLat.toFixed(5)}, ${h.foragingLng.toFixed(5)} · ${h.altitude}m`,
        `   Score per specie: ${preds}`,
      ].join("\n");
    })
    .join("\n\n");
}

function formatSocialTrendsBlock(
  hotspots: GeminiHotspotSnapshot[]
): string {
  const regions = hotspots.map((h) => h.region);
  return formatSocialTrendsForGeminiPrompt(regions);
}

export function buildGeminiForagingSystemInstruction(
  hotspots: GeminiHotspotSnapshot[],
  meta: GeminiChatContextMeta
): string {
  const dateLabel = formatDateLabel(meta.selectedDate);
  const today = todayISO();

  return `Sei l'assistente ufficiale di MushroomRadar per il foraging in Campania, Molise e Basilicata (Sud Italia).

REGOLE OBBLIGATORIE:
1. Basati ESCLUSIVAMENTE sui dati Sprout Score forniti sotto (hotspot reali del radar) e sui trend social elencati.
2. NON inventare zone, percentuali, coordinate o ritrovamenti non presenti nei dati.
3. Se i dati non bastano, dillo e suggerisci filtri concreti (raggio km, giorno, specie, fascia oraria).
4. Cita sempre percentuali e nomi zona dai dati quando consigli un posto.
5. I trend social sono contesto secondario: citali SOLO se presenti nel blocco TREND SOCIAL con autore (@handle), data e citazione tra virgolette. VIETATO frasi generiche («chiacchiericcio sui social», «TikTok conferma» senza autore). Se non hai fonti citabili, NON menzionare social.
6. Ricorda: identificazione funghi sempre con esperto; rispetto ambientale; non condividere spot sensibili.
7. Rispondi in italiano, tono pratico da cercatore, formattazione chiara con elenchi puntati se utile.

CONTESTO RICERCA UTENTE:
- Origine: ${meta.originName}
- Data analisi: ${dateLabel} (${meta.selectedDate}, oggi calendario=${today})
- Fascia oraria: ${meta.hourRangeLabel}
- Raggio: ${meta.rangeKm} km
- Filtro specie: ${meta.speciesFilter === "all" ? "tutte" : getSpeciesLabel(meta.speciesFilter)}
- Meteo live: ${meta.liveData ? "sì" : "cache/stimato"} · ultimo aggiornamento: ${meta.lastUpdate ?? "n/d"}

HOTSPOT SPRout SCORE (unica fonte per zone e percentuali):
${formatHotspotsBlock(hotspots)}

TREND SOCIAL / COMMUNITY (contesto, non sostituiscono gli score):
${formatSocialTrendsBlock(hotspots)}`;
}

export function extractGeminiText(response: GenerateContentResponse): string {
  const text = response.text?.trim();
  if (text) return text;
  throw new Error("Risposta Gemini vuota");
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await wait(delay);
    return withExponentialBackoff(fn, retries - 1, delay * 2);
  }
}

function formatSocialTrendsForMastro(hotspots: MastroHotspotPayload[]): string {
  const regions = [...new Set(hotspots.map((h) => h.region))];
  return formatSocialTrendsForGeminiPrompt(regions);
}

function buildVerifiedSourcesBlock(): string {
  const cached = getCachedVerifications();
  if (cached && cached.length > 0) {
    const officialBlock = formatVerifiedSourcesForGemini(cached, 40);
    const ytVerified = cached
      .filter(
        (v) =>
          v.level === "community" &&
          v.urlReachable &&
          v.url.includes("watch?v=")
      )
      .slice(0, 8)
      .map((v) => {
        const s = CERTIFIED_SOURCES.find((x) => x.id === v.sourceId);
        return {
          shortName: s?.shortName ?? v.sourceId,
          description: s?.description ?? "",
          url: v.url,
          youtubeAuthor: v.youtubeAuthor,
        };
      });
    const ytBlock = formatYoutubeSourcesForGemini(ytVerified, 8);
    return `${officialBlock}\n\n${ytBlock}`;
  }
  return `${formatCertifiedSourcesForGemini(30)}\n\n(Verifica URL fonti non ancora in cache — preferire enti .gov.it e Funghimagazine)`;
}

export function buildMastroFungaioloSystemInstruction(
  hotspots: MastroHotspotPayload[],
  meta: GeminiChatContextMeta
): string {
  const dateLabel = formatDateLabel(meta.selectedDate);
  const sourceBlock = buildVerifiedSourcesBlock();

  return `Sei l'Assistente AI ufficiale di MushroomRadar, un anziano Mastro Fungaiolo del Sud Italia. Il tuo carattere è schietto, pragmatico, caloroso e profondamente radicato nelle tradizioni locali dei boschi del Sannio, del Matese e dell'Irpinia. Conosci la biologia dei funghi a livello scientifico ed empirico.

Hai accesso in tempo reale a questi dati reali degli hotspot fungini calcolati dal sistema per le zone entro 3 ore da Benevento:
${JSON.stringify(hotspots, null, 2)}

CONTESTO RICERCA:
- Origine: ${meta.originName}
- Data: ${dateLabel} (${meta.selectedDate})
- Fascia oraria: ${meta.hourRangeLabel}
- Raggio: ${meta.rangeKm} km
- Meteo live: ${meta.liveData ? "sì" : "cache/stimato"} · aggiornamento: ${meta.lastUpdate ?? "n/d"}

TREND SOCIAL / COMMUNITY (contesto secondario, non sostituiscono gli Sprout Score):
${formatSocialTrendsForMastro(hotspots)}

REGOLE RIGIDE DI COMPORTAMENTO:
1. Basati ESCLUSIVAMENTE sui dati degli hotspot forniti sopra e sui trend social elencati. Non inventare località, percentuali Sprout Score o coordinate assenti dalla lista.
2. Se l'utente chiede zone fuori Campania/Molise/Basilicata o oltre il raggio del Radar (max ~3 ore da Benevento), spiega i limiti geografici con fermezza.
3. Se condizioni ambientali sono pessime (vento che asciuga la lettiera, suolo troppo secco/allagato, Sprout Score basso), sii onesto: consiglia di restare a casa o un'alternativa migliore dalla lista.
4. Usa terminologia da cercatore italiano (buttata, bottata, cacciata, spie, micelio, fungo spia).
5. I trend social servono solo se coerenti con gli Sprout Score. Se li citi, DEVI nominare autore e handle (@...) con citazione tra «» dalla lista TREND SOCIAL. VIETATO: «c'è un bel chiacchiericcio», «TikTok conferma» senza autore, frasi vaghe. Se non hai fonti nella lista, NON parlare di social.
6. Identificazione funghi sempre con esperto; rispetto ambientale; non condividere spot sensibili.
7. Restituisci JSON con 'reply' in Markdown e 'recommendedHotspotId' (id hotspot dalla lista, o null).
8. Usa SOLO i CONSIGLI ESPERTI e REGOLE SICUREZZA elencati sotto — non inventare habitat o normative.
9. COORDINATE: ogni hotspot ha foragingLat/foragingLng (area raccolta in bosco) e parkingLat/parkingLng (parcheggio base). Quando citi una zona, specifica che Google Maps va al PARcheggio e la raccolta è a piedi verso le coordinate foraging.
10. Gli Sprout Score e percentuali DEVONO coincidere con i valori sproutScore nel JSON — non arrotondare diversamente.

CONSIGLI ESPERTI (Funghimagazine, ARPA, normativa):
${getGlobalExpertTips()
  .map((t) => `- ${t.title}: ${t.tip} [${t.source}]`)
  .join("\n")}
${EXPERT_TIPS.filter((t) => t.species)
  .slice(0, 6)
  .map((t) => `- ${t.title} (${t.species}): ${t.tip}`)
  .join("\n")}

REGOLE SICUREZZA:
${UNIVERSAL_SAFETY_RULES.map((r) => `- ${r}`).join("\n")}

FONTI VERIFICATE (algoritmo: dominio ufficiale + URL raggiungibile + incrocio tematico — NON inventare altre):
${sourceBlock}`;
}

function parseMastroChatResponse(rawText: string): MastroChatResponse {
  const parsed = JSON.parse(rawText) as Partial<MastroChatResponse>;
  if (!parsed.reply || typeof parsed.reply !== "string") {
    throw new Error("JSON Mastro privo del campo reply");
  }

  const recommendedHotspotId =
    parsed.recommendedHotspotId === null ||
    parsed.recommendedHotspotId === undefined ||
    parsed.recommendedHotspotId === "null"
      ? null
      : String(parsed.recommendedHotspotId);

  return {
    reply: parsed.reply.trim(),
    recommendedHotspotId,
  };
}

export interface MastroForagingReplyResult extends MastroChatResponse {
  model: string;
  hotspotCount: number;
}

function resolveMastroModels(): string[] {
  const preferred = GEMINI_CHAT_MODEL.trim();
  const chain = [preferred, ...MASTRO_GEMINI_MODEL_FALLBACKS];
  return [...new Set(chain)];
}

async function generateMastroViaSdk(
  trimmed: string,
  hotspots: MastroHotspotPayload[],
  meta: GeminiChatContextMeta,
  model: string
): Promise<MastroForagingReplyResult> {
  const ai = getGeminiClient();
  const systemInstruction = buildMastroFungaioloSystemInstruction(
    hotspots,
    meta
  );

  const response = await withExponentialBackoff(() =>
    ai.models.generateContent({
      model,
      contents: `Domanda dell'utente: "${trimmed}"\n\nRispondi compilando lo schema JSON richiesto.`,
      config: {
        systemInstruction,
        temperature: 0.4,
        maxOutputTokens: 1400,
        topP: 0.9,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description:
                "Risposta testuale amichevole e dettagliata in Markdown per l'utente.",
            },
            recommendedHotspotId: {
              type: Type.STRING,
              description:
                "ID univoco dell'hotspot raccomandato presente nella lista, oppure null.",
              nullable: true,
            },
          },
          required: ["reply", "recommendedHotspotId"],
        },
      },
    })
  );

  const rawText = extractGeminiText(response);
  const parsed = parseMastroChatResponse(rawText);

  const validIds = new Set(hotspots.map((h) => h.id));
  if (
    parsed.recommendedHotspotId &&
    !validIds.has(parsed.recommendedHotspotId)
  ) {
    parsed.recommendedHotspotId = null;
  }

  return {
    ...parsed,
    model,
    hotspotCount: hotspots.length,
  };
}

/** REST (file allegato) → SDK fallback, con catena modelli */
export async function generateMastroFungaioloReply(
  userMessage: string,
  hotspots: MastroHotspotPayload[],
  meta: GeminiChatContextMeta
): Promise<MastroForagingReplyResult> {
  const trimmed = userMessage.trim();
  if (!trimmed) {
    throw new Error("Messaggio vuoto");
  }

  const apiKey = process.env[GEMINI_API_KEY_ENV]?.trim();
  if (!apiKey) {
    throw new Error(`${GEMINI_API_KEY_ENV} non configurata`);
  }

  const systemInstruction = buildMastroFungaioloSystemInstruction(
    hotspots,
    meta
  );
  const models = resolveMastroModels();
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const rest = await generateMastroViaRest({
        userMessage: trimmed,
        hotspots,
        systemPrompt: systemInstruction,
        apiKey,
        modelName: model,
      });
      return {
        reply: rest.reply,
        recommendedHotspotId: rest.recommendedHotspotId,
        model: rest.model,
        hotspotCount: hotspots.length,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    try {
      return await generateMastroViaSdk(trimmed, hotspots, meta, model);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error("Nessun modello Gemini disponibile");
}

export interface GeminiForagingReplyResult {
  reply: string;
  model: string;
  hotspotCount: number;
  recommendedHotspotId?: string | null;
}

/** Alias retrocompatibile — delega al Mastro Fungaiolo */
export async function generateGeminiForagingReply(
  userMessage: string,
  hotspots: GeminiHotspotSnapshot[],
  meta: GeminiChatContextMeta
): Promise<GeminiForagingReplyResult> {
  const mastroPayload: MastroHotspotPayload[] = hotspots.map((h) => ({
    id: h.zoneId,
    name: h.zoneName,
    region: h.region,
    foragingLat: h.foragingLat,
    foragingLng: h.foragingLng,
    parkingLat: h.parkingLat,
    parkingLng: h.parkingLng,
    parkingLabel: h.parkingLabel,
    altitude: h.altitude,
    forestType: h.forestType,
    lat: h.foragingLat,
    lng: h.foragingLng,
    sproutScore: h.activeScore,
    soilMoisture: undefined,
    species: h.predictions.map((p) => p.label),
    distanceKm: h.kmFromOrigin,
    travelTimeMin: h.driveMinutesFromOrigin,
    socialTrendActive: isSocialTrendActiveForRegion(h.region),
  }));

  const result = await generateMastroFungaioloReply(
    userMessage,
    mastroPayload,
    meta
  );

  return {
    reply: result.reply,
    model: result.model,
    hotspotCount: result.hotspotCount,
    recommendedHotspotId: result.recommendedHotspotId,
  };
}