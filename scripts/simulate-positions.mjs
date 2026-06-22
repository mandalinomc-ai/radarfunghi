/**
 * Simulazione validazione posizioni zone + origini campione.
 * Esegui: node scripts/simulate-positions.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const ITALY = { minLat: 36.6, maxLat: 47.1, minLng: 6.6, maxLng: 18.5 };
const SUD = { minLat: 39.8, maxLat: 42.2, minLng: 13.8, maxLng: 16.8 };
const MAX_WALK_M = 4500;

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1000;
}

function inBox(lat, lng, b) {
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}

// Parse zone coords from mockData.ts (parkingLat lines)
const mock = readFileSync(join(root, "src/lib/mockData.ts"), "utf8");
const zoneBlocks = [...mock.matchAll(/id: "([^"]+)"[\s\S]*?lat: ([\d.]+),\s*\n\s*lng: ([\d.]+),[\s\S]*?parkingLat: ([\d.]+),\s*\n\s*parkingLng: ([\d.]+),[\s\S]*?altitude: (\d+)/g)];

const zones = zoneBlocks.map((m) => ({
  id: m[1],
  lat: +m[2],
  lng: +m[3],
  parkingLat: +m[4],
  parkingLng: +m[5],
  altitude: +m[6],
}));

const origins = [
  { name: "Benevento", lat: 41.1297, lng: 14.7825 },
  { name: "Napoli centro", lat: 40.8518, lng: 14.2681 },
  { name: "Campobasso", lat: 41.5608, lng: 14.6654 },
  { name: "Potenza", lat: 40.638, lng: 15.805 },
];

let errors = 0;
let warnings = 0;

console.log("=== MushroomRadar — Simulazione posizioni ===\n");
console.log(`Zone analizzate: ${zones.length}\n`);

for (const z of zones) {
  const issues = [];
  for (const [label, lat, lng] of [
    ["foraging", z.lat, z.lng],
    ["parking", z.parkingLat, z.parkingLng],
  ]) {
    if (!inBox(lat, lng, ITALY)) issues.push(`ERR ${label} fuori Italia`);
    else if (!inBox(lat, lng, SUD)) issues.push(`WARN ${label} fuori Sud operativo`);
  }
  const walk = haversineM(z.parkingLat, z.parkingLng, z.lat, z.lng);
  if (walk > MAX_WALK_M) issues.push(`ERR parcheggio-bosco ${Math.round(walk)} m`);
  if (z.altitude < 200 || z.altitude > 2200) issues.push(`WARN quota ${z.altitude} m`);

  if (issues.length) {
    console.log(`${z.id}:`);
    for (const i of issues) {
      console.log(`  ${i}`);
      if (i.startsWith("ERR")) errors++;
      else warnings++;
    }
  }
}

console.log("\n--- Origini campione (distanza → parcheggio più vicino) ---");
for (const o of origins) {
  let nearest = { id: "", km: Infinity };
  for (const z of zones) {
    const km = haversineM(o.lat, o.lng, z.parkingLat, z.parkingLng) / 1000;
    if (km < nearest.km) nearest = { id: z.id, km };
  }
  console.log(`${o.name}: più vicino ${nearest.id} (${nearest.km.toFixed(1)} km air)`);
}

console.log(`\n=== Risultato: ${errors} errori, ${warnings} avvisi ===`);
if (errors > 0) process.exit(1);
console.log("OK — tutte le coordinate zone superano la simulazione.");
