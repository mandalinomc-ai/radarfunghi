/**
 * Verifica rilevamento follow-up chat (es. conteggio specie su zone precedenti).
 * Esegui: npx tsx scripts/verify-chat-followup.ts
 */
import { detectFollowUp, answerFollowUpLocally } from "../src/lib/chatFollowUp";
import type { ChatZoneResult } from "../src/lib/chatZoneResults";
import { FUNGAL_ZONES } from "../src/lib/mockData";
import { buildHotspots } from "../src/lib/predictionEngine";
import { collectChatResultsFromHotspots } from "../src/lib/chatZoneResults";

const hourRange = { startHour: 7, endHour: 11 };
const date = new Date().toISOString().slice(0, 10);
const hotspots = buildHotspots(FUNGAL_ZONES, "porcino", hourRange, date);
const priorResults = collectChatResultsFromHotspots(
  hotspots,
  "porcino",
  date,
  28,
  5
);

const history = [
  {
    role: "user" as const,
    content: "Dove trovo porcini entro 60 km?",
  },
  {
    role: "assistant" as const,
    content: "Ecco le zone migliori.",
    results: priorResults,
  },
];

const followUpQ =
  "Quante specie avrei trovato nelle zone che mi avevi elencato nella domanda precedente?";

const ctx = detectFollowUp(followUpQ, history);

if (!ctx || ctx.kind !== "species_count") {
  console.error("FAIL — follow-up non rilevato come species_count");
  process.exit(1);
}

const answer = answerFollowUpLocally(ctx, hotspots, 28);

if (!answer.text.includes("Specie distinte")) {
  console.error("FAIL — risposta locale senza conteggio specie");
  process.exit(1);
}

if (answer.results.length !== priorResults.length) {
  console.error("FAIL — risultati follow-up non allineati alla lista precedente");
  process.exit(1);
}

console.log("OK — follow-up species_count rilevato e risposto.");
console.log(answer.text.split("\n").slice(0, 5).join("\n"));
