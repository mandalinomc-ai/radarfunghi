/**
 * Simulazione bearing/bussola — npm run verify:compass
 */

function computeBearingDeg(fromLat, fromLng, toLat, toLng) {
  const φ1 = (fromLat * Math.PI) / 180;
  const φ2 = (toLat * Math.PI) / 180;
  const Δλ = ((toLng - fromLng) * Math.PI) / 180;
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360;
}

const BENEVENTO = { lat: 41.1296, lng: 14.7826 };
const TABURNO_PARKING = { lat: 41.0718, lng: 14.6654, name: "Taburno Cima Camposauro" };

const bearing = computeBearingDeg(
  BENEVENTO.lat,
  BENEVENTO.lng,
  TABURNO_PARKING.lat,
  TABURNO_PARKING.lng
);

console.log(
  `Benevento → ${TABURNO_PARKING.name}: ${Math.round(bearing)}° (atteso SW ~225-250°)`
);

const inRange = bearing > 200 && bearing < 280;
if (!inRange) {
  console.error("FAIL: bearing fuori range atteso");
  process.exit(1);
}

console.log("verify:compass OK");
process.exit(0);
