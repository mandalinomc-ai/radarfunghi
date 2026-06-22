/** Punto di riferimento: Benevento città (centro) */
export const BENEVENTO = {
  name: "Benevento",
  lat: 41.1297,
  lng: 14.7825,
};

/** Raggio massimo in minuti di viaggio (3 ore) */
export const MAX_DRIVE_MINUTES_FROM_BENEVENTO = 180;

/** Conversione minuti di viaggio → km stradali stimati (~55 km/h media) */
export function driveMinutesToKm(minutes: number): number {
  return Math.round((minutes / 60) * 55);
}

export const MIN_SEARCH_RADIUS_KM = 10;
export const MAX_SEARCH_RADIUS_KM = driveMinutesToKm(
  MAX_DRIVE_MINUTES_FROM_BENEVENTO
);
export const DEFAULT_SEARCH_RADIUS_KM = MAX_SEARCH_RADIUS_KM;

export function formatSearchRadius(km: number, originName = "Benevento"): string {
  return km >= MAX_SEARCH_RADIUS_KM
    ? `${km} km (max)`
    : `${km} km da ${originName}`;
}

export function formatDriveFromBenevento(minutes: number): string {
  if (minutes < 60) return `${minutes} min da Benevento`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min da Benevento` : `${h}h da Benevento`;
}
