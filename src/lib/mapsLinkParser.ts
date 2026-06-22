export interface ParsedMapLocation {
  lat: number;
  lng: number;
  source: "google_maps_url" | "coordinates" | "query";
  raw: string;
}

function isValidCoord(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function inItalySouthBBox(lat: number, lng: number): boolean {
  return lat >= 39 && lat <= 43 && lng >= 13 && lng <= 17;
}

/** Estrae lat/lng da URL Google Maps o testo coordinate. */
export function parseMapsInput(input: string): ParsedMapLocation | null {
  const raw = input.trim();
  if (!raw) return null;

  const decimalPair =
    raw.match(
      /(-?\d{1,2}[.,]\d{3,8})\s*[,;\s]\s*(-?\d{1,3}[.,]\d{3,8})/
    ) ??
    raw.match(/^(-?\d{1,2}[.,]\d+)\s+(-?\d{1,3}[.,]\d+)$/);

  if (decimalPair && !raw.includes("google") && !raw.includes("maps")) {
    const lat = Number(decimalPair[1].replace(",", "."));
    const lng = Number(decimalPair[2].replace(",", "."));
    if (isValidCoord(lat, lng)) {
      return { lat, lng, source: "coordinates", raw };
    }
  }

  try {
    const url = raw.startsWith("http") ? new URL(raw) : new URL(`https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");

    if (host.includes("google") && url.pathname.includes("/maps")) {
      const q = url.searchParams.get("q") ?? url.searchParams.get("query");
      if (q) {
        const fromQ = q.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
        if (fromQ) {
          const lat = Number(fromQ[1]);
          const lng = Number(fromQ[2]);
          if (isValidCoord(lat, lng)) {
            return { lat, lng, source: "google_maps_url", raw };
          }
        }
      }

      const dest = url.searchParams.get("destination");
      if (dest) {
        const fromDest = dest.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
        if (fromDest) {
          const lat = Number(fromDest[1]);
          const lng = Number(fromDest[2]);
          if (isValidCoord(lat, lng)) {
            return { lat, lng, source: "google_maps_url", raw };
          }
        }
      }

      const atMatch = url.href.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (atMatch) {
        const lat = Number(atMatch[1]);
        const lng = Number(atMatch[2]);
        if (isValidCoord(lat, lng)) {
          return { lat, lng, source: "google_maps_url", raw };
        }
      }

      const placeMatch = url.href.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
      if (placeMatch) {
        const lat = Number(placeMatch[1]);
        const lng = Number(placeMatch[2]);
        if (isValidCoord(lat, lng)) {
          return { lat, lng, source: "google_maps_url", raw };
        }
      }
    }

    if (host === "goo.gl" || host === "maps.app.goo.gl") {
      return null;
    }
  } catch {
    /* non URL */
  }

  const loose = raw.match(
    /(-?\d{1,2}[.,]\d{4,8})\s*[,;\s]\s*(-?\d{1,3}[.,]\d{4,8})/
  );
  if (loose) {
    const lat = Number(loose[1].replace(",", "."));
    const lng = Number(loose[2].replace(",", "."));
    if (isValidCoord(lat, lng)) {
      return { lat, lng, source: "coordinates", raw };
    }
  }

  return null;
}

export function validateMapsLocation(
  loc: ParsedMapLocation
): { ok: true } | { ok: false; error: string } {
  if (!inItalySouthBBox(loc.lat, loc.lng)) {
    return {
      ok: false,
      error:
        "Coordinate fuori dall'area coperta (Centro-Sud Italia: lat 39–43, lng 13–17).",
    };
  }
  return { ok: true };
}

export function formatCoordsExport(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

export function googleMapsPinUrl(lat: number, lng: number, label?: string): string {
  const q = label
    ? encodeURIComponent(`${label} ${lat},${lng}`)
    : `${lat},${lng}`;
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export function googleMapsDirUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
}

export function toGeoJsonPoint(
  lat: number,
  lng: number,
  properties: Record<string, string>
): string {
  return JSON.stringify(
    {
      type: "Feature",
      geometry: { type: "Point", coordinates: [lng, lat] },
      properties,
    },
    null,
    2
  );
}
