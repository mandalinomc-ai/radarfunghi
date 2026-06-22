import type { MapHotspot, MushroomSpecies } from "./types";
import type { ChatZoneResult } from "./chatZoneResults";
import { getSpeciesLabel } from "./predictionEngine";
import { buildGpsLinks } from "./mapUtils";

export type FollowUpKind =
  | "species_count"
  | "zone_detail"
  | "coords_detail"
  | "generic_reference";

export interface FollowUpContext {
  kind: FollowUpKind;
  priorResults: ChatZoneResult[];
  priorUserQuestion?: string;
}

export interface ChatTurnForHistory {
  role: "user" | "assistant";
  content: string;
  results?: ChatZoneResult[];
}

const PRIOR_REF =
  /(?:elencat|indicat|suggerit|mostrat|detto|citato|precedent|sopra|quell[ae]|stess[ae]|lista|risposta\s+di\s+prima|domanda\s+precedent|zone\s+che\s+hai)/i;

const SPECIES_COUNT =
  /quante?\s+specie|quanti\s+tipi|quanti\s+fungh|quante?\s+variet|conteggio\s+specie/i;

const COORDS_ASK =
  /coordinate|gps|google\s+earth|posizione\s+esatt|dove\s+sono\s+esatt/i;

const ZONE_DETAIL =
  /(?:perché|perche|spiegami|dettagli|altitudine|parcheggio|raccolta).*(?:quell|quest|zone)/i;

export function getLastAssistantResults(
  messages: ChatTurnForHistory[]
): ChatZoneResult[] {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.results && m.results.length > 0) {
      return m.results;
    }
  }
  return [];
}

export function getLastUserQuestion(
  messages: ChatTurnForHistory[]
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return undefined;
}

export function detectFollowUp(
  text: string,
  messages: ChatTurnForHistory[]
): FollowUpContext | null {
  const priorResults = getLastAssistantResults(messages);
  if (priorResults.length === 0) return null;

  const lower = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const refersPrior =
    PRIOR_REF.test(text) ||
    PRIOR_REF.test(lower) ||
    /^(e\s+)?(quante|quanti|quali|come|perche|perché|dove|quanto)/i.test(text);

  if (!refersPrior && messages.filter((m) => m.role === "user").length < 2) {
    return null;
  }

  const priorUser = [...messages]
    .reverse()
    .find((m) => m.role === "user" && m.content !== text)?.content;

  if (SPECIES_COUNT.test(text) || SPECIES_COUNT.test(lower)) {
    return {
      kind: "species_count",
      priorResults,
      priorUserQuestion: priorUser,
    };
  }

  if (COORDS_ASK.test(text) || COORDS_ASK.test(lower)) {
    return {
      kind: "coords_detail",
      priorResults,
      priorUserQuestion: priorUser,
    };
  }

  if (ZONE_DETAIL.test(text)) {
    return {
      kind: "zone_detail",
      priorResults,
      priorUserQuestion: priorUser,
    };
  }

  if (PRIOR_REF.test(text) || PRIOR_REF.test(lower)) {
    return {
      kind: "generic_reference",
      priorResults,
      priorUserQuestion: priorUser,
    };
  }

  if (messages.filter((m) => m.role === "user").length >= 2 && refersPrior) {
    return {
      kind: "generic_reference",
      priorResults,
      priorUserQuestion: priorUser,
    };
  }

  return null;
}

export interface FollowUpLocalAnswer {
  text: string;
  results: ChatZoneResult[];
}

export function answerFollowUpLocally(
  followUp: FollowUpContext,
  hotspots: MapHotspot[],
  minScore = 28
): FollowUpLocalAnswer {
  const zoneIds = [...new Set(followUp.priorResults.map((r) => r.zoneId))];

  switch (followUp.kind) {
    case "species_count":
      return buildSpeciesCountAnswer(zoneIds, hotspots, minScore, followUp.priorResults);
    case "coords_detail":
      return buildCoordsAnswer(zoneIds, hotspots, followUp.priorResults);
    case "zone_detail":
    case "generic_reference":
      return {
        text: buildPriorZonesSummary(followUp.priorResults, followUp.priorUserQuestion),
        results: followUp.priorResults,
      };
  }
}

function buildSpeciesCountAnswer(
  zoneIds: string[],
  hotspots: MapHotspot[],
  minScore: number,
  priorResults: ChatZoneResult[]
): FollowUpLocalAnswer {
  const allSpecies = new Set<MushroomSpecies>();
  const lines: string[] = [];

  for (const zoneId of zoneIds) {
    const h = hotspots.find((x) => x.zone.id === zoneId);
    if (!h) {
      const prior = priorResults.find((r) => r.zoneId === zoneId);
      lines.push(
        `**${prior?.zoneName ?? zoneId}**: dati zona non in elenco attuale (usa le schede precedenti).`
      );
      continue;
    }
    const viable = h.predictions
      .filter((p) => p.score >= minScore)
      .sort((a, b) => b.score - a.score);
    viable.forEach((p) => allSpecies.add(p.species));
    const spLine =
      viable.length > 0
        ? viable
            .map((p) => `${getSpeciesLabel(p.species)} **${p.score}%**`)
            .join(" · ")
        : "nessuna specie sopra soglia";
    lines.push(`**${h.zone.name}**: ${spLine}`);
  }

  const speciesLabels = [...allSpecies].map(getSpeciesLabel).join(", ");

  return {
    text: [
      `**Analisi sulle ${zoneIds.length} zone della risposta precedente**`,
      ``,
      `Specie distinte con Sprout Score ≥${minScore}%: **${allSpecies.size}** (${speciesLabels || "nessuna"}).`,
      ``,
      ...lines.map((l) => `- ${l}`),
      ``,
      `_Non è una nuova ricerca: sto rispondendo alla domanda precedente._`,
    ].join("\n"),
    results: priorResults,
  };
}

function buildCoordsAnswer(
  zoneIds: string[],
  hotspots: MapHotspot[],
  priorResults: ChatZoneResult[]
): FollowUpLocalAnswer {
  const lines: string[] = [
    "**Coordinate GPS certificate (5 decimali) — identiche su Google Maps e Google Earth:**",
    "",
  ];

  for (const zoneId of zoneIds) {
    const h = hotspots.find((x) => x.zone.id === zoneId);
    const prior = priorResults.find((r) => r.zoneId === zoneId);
    if (!h && prior) {
      lines.push(`**${prior.zoneName}**`);
      lines.push(`- 🅿️ Parcheggio: \`${prior.coords}\``);
      lines.push(`- 🌲 Raccolta: \`${prior.foragingCoords}\``);
      lines.push("");
      continue;
    }
    if (!h) continue;
    const parking = buildGpsLinks(h.zone.parkingLat, h.zone.parkingLng);
    const foraging = buildGpsLinks(h.zone.lat, h.zone.lng);
    lines.push(`**${h.zone.name}** (${h.zone.altitude} m)`);
    lines.push(`- 🅿️ Parcheggio: \`${parking.display}\` (navigazione strada)`);
    lines.push(`- 🌲 Raccolta: \`${foraging.display}\` (punto in bosco)`);
    lines.push("");
  }

  lines.push(
    "_Importante: il parcheggio e il punto raccolta sono due coordinate diverse. Incolla i numeri in Earth o usa i link «Raccolta» / «Earth» nelle schede._"
  );

  return { text: lines.join("\n"), results: priorResults };
}

function buildPriorZonesSummary(
  priorResults: ChatZoneResult[],
  priorQuestion?: string
): string {
  const zones = priorResults
    .map((r) => `**${r.zoneName}** — ${r.score}% ${r.speciesLabel}`)
    .join("\n- ");
  const q = priorQuestion ? ` alla domanda «${priorQuestion.slice(0, 120)}»` : "";
  return `Mi riferisco alle zone che ti ho indicato${q}:\n\n- ${zones}\n\nFammi una domanda specifica su queste zone (specie, coordinate, confronto, quale scegliere).`;
}

export function formatConversationForGemini(
  messages: ChatTurnForHistory[],
  maxTurns = 8
): Array<{ role: "user" | "model"; text: string }> {
  const turns = messages
    .filter(
      (m) =>
        m.role === "user" ||
        (m.role === "assistant" && !m.content.startsWith("Salve, uagliò"))
    )
    .slice(-maxTurns);

  return turns.map((m) => {
    let text = m.content.slice(0, 1200);
    if (m.role === "assistant" && m.results && m.results.length > 0) {
      const zoneSummary = m.results
        .map(
          (r) =>
            `${r.zoneName} (${r.zoneId}): ${r.score}% ${r.speciesLabel}, parcheggio ${r.coords}, raccolta ${r.foragingCoords}`
        )
        .join("; ");
      text += `\n[Zone elencate: ${zoneSummary}]`;
    }
    return {
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      text,
    };
  });
}

export function formatPriorResultsBlock(results: ChatZoneResult[]): string {
  if (results.length === 0) return "Nessuna zona nella risposta precedente.";
  return results
    .map((r, i) => {
      return [
        `${i + 1}. ${r.zoneName} [id=${r.zoneId}]`,
        `   ${r.speciesLabel} ${r.score}% · ${r.dateLabel}`,
        `   Parcheggio GPS: ${r.coords}`,
        `   Raccolta GPS: ${r.foragingCoords} · ${r.altitude}m`,
      ].join("\n");
    })
    .join("\n\n");
}
