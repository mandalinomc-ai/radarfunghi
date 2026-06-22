import type { FungalZone } from "./types";

export const ALL_ZONE_REGIONS: FungalZone["region"][] = [
  "matese",
  "taburno",
  "sannio",
  "molise",
  "campania",
  "basilicata",
];

export function filterZonesByRegions(
  zones: FungalZone[],
  includedRegions: FungalZone["region"][]
): FungalZone[] {
  if (includedRegions.length === 0) return zones;
  const set = new Set(includedRegions);
  return zones.filter((z) => set.has(z.region));
}
