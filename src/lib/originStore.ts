import { BENEVENTO } from "./benevento";
import type { GeoPoint, OriginSource, PositionConfidence } from "./geoUtils";
import { validateUserOrigin } from "./zoneCoordinateService";

const STORAGE_KEY = "mushroomradar-origin";
const ORIGIN_CONFIRMED_KEY = "mushroomradar-origin-confirmed";

interface StoredOrigin extends GeoPoint {
  source: OriginSource;
}

export function defaultOrigin(): GeoPoint {
  return {
    name: BENEVENTO.name,
    lat: BENEVENTO.lat,
    lng: BENEVENTO.lng,
    source: "benevento",
    positionConfidence: "high",
  };
}

export function loadStoredOrigin(): GeoPoint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredOrigin;
    if (
      typeof parsed.name !== "string" ||
      typeof parsed.lat !== "number" ||
      typeof parsed.lng !== "number"
    ) {
      return null;
    }
    const check = validateUserOrigin({
      lat: parsed.lat,
      lng: parsed.lng,
      accuracyMeters: parsed.accuracyMeters,
    });
    if (!check.valid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredOrigin(origin: GeoPoint): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...origin,
      source: origin.source ?? "custom",
    })
  );
}

export function loadOriginConfirmed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ORIGIN_CONFIRMED_KEY) === "1";
}

export function saveOriginConfirmed(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ORIGIN_CONFIRMED_KEY, "1");
}

export function clearOriginConfirmed(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ORIGIN_CONFIRMED_KEY);
}

export function originModeLabel(origin: GeoPoint): string {
  if (origin.source === "gps") return "📍 GPS";
  if (origin.source === "benevento") return "🏠 Benevento";
  return "📌 Personalizzato";
}

export function originAccuracyWarning(origin: GeoPoint): string | null {
  if (origin.accuracyMeters != null && origin.accuracyMeters > 500) {
    return `GPS impreciso (±${Math.round(origin.accuracyMeters)} m)`;
  }
  if (origin.positionConfidence === "low") {
    return "Posizione approssimativa — seleziona un comune dalla lista";
  }
  return null;
}

export async function reverseGeocodeLabel(
  lat: number,
  lng: number
): Promise<string> {
  try {
    const res = await fetch(
      `/api/geocode?lat=${encodeURIComponent(String(lat))}&lng=${encodeURIComponent(String(lng))}`
    );
    if (!res.ok) return "La mia posizione";
    const data = await res.json();
    const first = data.results?.[0];
    return first?.name ?? "La mia posizione";
  } catch {
    return "La mia posizione";
  }
}

export function captureGpsOrigin(): Promise<GeoPoint> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("GPS non disponibile su questo dispositivo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const accuracyMeters = pos.coords.accuracy ?? null;

        const check = validateUserOrigin({ lat, lng, accuracyMeters });
        if (!check.valid) {
          reject(new Error(check.errors[0] ?? "Posizione non valida"));
          return;
        }

        const name = await reverseGeocodeLabel(lat, lng);
        resolve({
          name,
          lat,
          lng,
          source: "gps",
          accuracyMeters,
          positionConfidence:
            accuracyMeters != null && accuracyMeters <= 100
              ? "high"
              : accuracyMeters != null && accuracyMeters <= 500
                ? "medium"
                : "low",
        });
      },
      (err) => {
        reject(
          new Error(
            err.code === 1
              ? "Permesso posizione negato. Abilita il GPS nelle impostazioni."
              : "Impossibile ottenere la posizione"
          )
        );
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });
}

export function validateCustomOrigin(
  lat: number,
  lng: number,
  confidence?: PositionConfidence
): { valid: boolean; error?: string } {
  const check = validateUserOrigin({ lat, lng });
  if (!check.valid) {
    return { valid: false, error: check.errors[0] };
  }
  if (confidence === "low") {
    return {
      valid: false,
      error: "Luogo troppo generico — scegli un comune o paese specifico",
    };
  }
  return { valid: true };
}
