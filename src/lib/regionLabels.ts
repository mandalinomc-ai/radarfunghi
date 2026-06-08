export const REGION_LABELS: Record<string, string> = {
  matese: "Matese",
  taburno: "Taburno",
  sannio: "Sannio",
  molise: "Molise",
  campania: "Campania",
  basilicata: "Basilicata",
};

export function getRegionLabel(region: string): string {
  return REGION_LABELS[region] ?? region;
}
