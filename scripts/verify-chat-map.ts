/**
 * Verifica che i risultati chat (species=all) coincidano con activeScore/activeSpecies mappa.
 * Esegui: npx tsx scripts/verify-chat-map.ts
 */
import { FUNGAL_ZONES } from "../src/lib/mockData";
import { buildHotspots } from "../src/lib/predictionEngine";
import { collectChatResultsFromHotspots } from "../src/lib/chatZoneResults";
import { formatHourRange } from "../src/lib/timeRange";

const hourRange = { startHour: 7, endHour: 11 };
const date = new Date().toISOString().slice(0, 10);
const species = "porcino" as const;

const hotspots = buildHotspots(FUNGAL_ZONES, species, hourRange, date);
const hrLabel = formatHourRange(hourRange);
const chatResults = collectChatResultsFromHotspots(
  hotspots,
  "all",
  date,
  0,
  20,
  { hourRangeLabel: hrLabel }
);

let mismatches = 0;

console.log("=== MushroomRadar — Coerenza chat ↔ mappa ===\n");
console.log(`Hotspot mappa: ${hotspots.length}`);
console.log(`Risultati chat (all): ${chatResults.length}`);
console.log(`Fascia: ${hrLabel}\n`);

for (const r of chatResults) {
  const h = hotspots.find((x) => x.zone.id === r.zoneId);
  if (!h) {
    console.log(`ERR zona assente in mappa: ${r.zoneId}`);
    mismatches++;
    continue;
  }
  if (h.activeScore !== r.score) {
    console.log(
      `ERR ${r.zoneName}: mappa=${h.activeScore}% chat=${r.score}%`
    );
    mismatches++;
  }
  if (h.activeSpecies !== r.species) {
    console.log(
      `ERR ${r.zoneName}: specie mappa=${h.activeSpecies} chat=${r.species}`
    );
    mismatches++;
  }
}

const topMap = [...hotspots].sort((a, b) => b.activeScore - a.activeScore)[0];
const topChat = chatResults[0];
if (topMap && topChat && topMap.zone.id !== topChat.zoneId) {
  console.log(
    `WARN top zona diversa: mappa=${topMap.zone.name} chat=${topChat.zoneName}`
  );
}

if (mismatches === 0) {
  console.log("\nOK — chat allineata alla mappa (activeScore/activeSpecies).");
  process.exit(0);
}

console.log(`\nFAIL — ${mismatches} incoerenze.`);
process.exit(1);
