import { FUNGAL_ZONES } from "../src/lib/mockData.ts";
import { buildHotspots, calculateSproutScore } from "../src/lib/predictionEngine.ts";
import { getHoursInRange } from "../src/lib/timeRange.ts";
import { todayISO } from "../src/lib/dateUtils.ts";
import { distanceFromPoint } from "../src/lib/geoUtils.ts";

const date = todayISO();
const hourRange = { startHour: 6, endHour: 10 };
const partenioLat = 41.0123;
const partenioLng = 14.7123;

let best = FUNGAL_ZONES[0];
let bestD = Infinity;
for (const z of FUNGAL_ZONES) {
  const d = distanceFromPoint(
    { lat: partenioLat, lng: partenioLng, name: "Partenio" },
    z.lat,
    z.lng
  ).roadKm;
  if (d < bestD) {
    bestD = d;
    best = z;
  }
}

const hours = getHoursInRange(hourRange);
console.log("Data:", date);
console.log("Zona più vicina:", best.name, `(${bestD.toFixed(1)} km)`);
console.log("Quota:", best.altitude, "m | Esposizione:", best.exposure);

for (const sp of ["porcino", "estatino", "galletto"]) {
  const scores = hours.map((h) => ({
    hour: h,
    ...calculateSproutScore(best, sp, h, date),
  }));
  const peak = scores.reduce((a, b) => (a.score > b.score ? a : b));
  console.log(`\n${sp.toUpperCase()}:`);
  console.log("  Score max:", peak.score + "%", "alle", peak.hour + ":00");
  console.log("  Raccomandazione:", peak.recommendation ?? "—");
}

const hotspots = buildHotspots([best], "all", hourRange, date);
const h = hotspots[0];
console.log("\nHotspot attivo:", h?.activeSpecies, h?.activeScore + "%");
console.log("Verdetto ritrovamento amico: score ≥70% = condizioni favorevoli");
