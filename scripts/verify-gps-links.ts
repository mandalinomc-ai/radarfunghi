/**
 * Verifica allineamento coordinate display ↔ URL Maps ↔ URL Earth.
 * Esegui: npx tsx scripts/verify-gps-links.ts
 */
import { FUNGAL_ZONES } from "../src/lib/mockData";
import { hotspotToChatZoneResult } from "../src/lib/chatZoneResults";
import { buildGpsLinks } from "../src/lib/mapUtils";
import { buildHotspots } from "../src/lib/predictionEngine";

const hourRange = { startHour: 7, endHour: 11 };
const date = new Date().toISOString().slice(0, 10);
const hotspots = buildHotspots(FUNGAL_ZONES, "porcino", hourRange, date);

let errors = 0;

console.log("=== MushroomRadar — Verifica GPS Maps/Earth ===\n");

for (const h of hotspots.slice(0, 8)) {
  const r = hotspotToChatZoneResult(h, "porcino", date);
  const parking = buildGpsLinks(h.zone.parkingLat, h.zone.parkingLng);
  const foraging = buildGpsLinks(h.zone.lat, h.zone.lng);

  const checks: Array<[string, boolean]> = [
    ["display parcheggio", r.coords === parking.display],
    ["display raccolta", r.foragingCoords === foraging.display],
    ["Maps raccolta pin", r.mapsForagingUrl === foraging.mapsPin],
    ["Earth raccolta", r.earthForagingUrl === foraging.earthPin],
    ["Earth parcheggio", r.earthParkingUrl === parking.earthPin],
    [
      "Maps/Earth stesso pair raccolta",
      r.mapsForagingUrl.includes(foraging.lat.toFixed(5)) &&
        r.earthForagingUrl.includes(foraging.lat.toFixed(5)),
    ],
  ];

  const failed = checks.filter(([, ok]) => !ok);
  if (failed.length > 0) {
    console.log(`ERR ${r.zoneName}:`);
    for (const [label] of failed) console.log(`  - ${label}`);
    errors += failed.length;
  }
}

if (errors === 0) {
  console.log("OK — coordinate display e link Maps/Earth allineati (5 decimali).");
  process.exit(0);
}

console.log(`\nFAIL — ${errors} problemi.`);
process.exit(1);
