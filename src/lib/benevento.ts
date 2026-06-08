/** Punto di riferimento: Benevento città (centro) */
export const BENEVENTO = {
  name: "Benevento",
  lat: 41.1297,
  lng: 14.7825,
};

/** Raggio massimo in minuti di viaggio (3 ore) */
export const MAX_DRIVE_MINUTES_FROM_BENEVENTO = 180;

export function formatDriveFromBenevento(minutes: number): string {
  if (minutes < 60) return `${minutes} min da Benevento`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min da Benevento` : `${h}h da Benevento`;
}
