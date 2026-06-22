import type { FungalZone } from "./types";

/** Ritenzione idrica per recovery post-malluvione — audit Gemini §4.1 */
export type SoilRetentionClass = "calcareous" | "clay" | "mixed";

const CALCAREOUS_REGIONS = new Set<FungalZone["region"]>([
  "matese",
  "taburno",
  "sannio",
]);

const CLAY_ZONE_IDS = new Set([
  "sannio-cerreto",
  "sannio-telese",
  "molise-trivento",
  "molise-bojano",
  "molise-campobasso",
  "basilicata-vulture",
  "basilicata-gallipoli-cognato",
]);

export function classifySoilRetention(zone: FungalZone): SoilRetentionClass {
  if (CALCAREOUS_REGIONS.has(zone.region) && zone.altitude >= 700) {
    return "calcareous";
  }
  if (
    CLAY_ZONE_IDS.has(zone.id) ||
    zone.forestType.toLowerCase().includes("argill") ||
    (zone.region === "molise" && zone.altitude < 850)
  ) {
    return "clay";
  }
  return "mixed";
}

/** Recovery giornaliero post-alluvione: calcareo +15%, argilloso +5%, misto +10% */
export function floodRecoveryRatePerDay(zone: FungalZone): number {
  switch (classifySoilRetention(zone)) {
    case "calcareous":
      return 0.15;
    case "clay":
      return 0.05;
    default:
      return 0.1;
  }
}
