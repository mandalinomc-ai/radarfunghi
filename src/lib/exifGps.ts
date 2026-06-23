import exifr from "exifr";

export interface GpsCoordinates {
  lat: number;
  lng: number;
}

/** Estrae coordinate GPS da buffer immagine (JPEG/HEIC con EXIF). */
export async function extractGpsFromBuffer(
  buffer: Buffer
): Promise<GpsCoordinates | null> {
  try {
    const gps = await exifr.gps(buffer);
    if (
      !gps ||
      typeof gps.latitude !== "number" ||
      typeof gps.longitude !== "number"
    ) {
      return null;
    }
    return { lat: gps.latitude, lng: gps.longitude };
  } catch {
    return null;
  }
}

export async function extractGpsFromBase64(
  base64: string
): Promise<GpsCoordinates | null> {
  const clean = base64.replace(/^data:[^;]+;base64,/, "");
  const buffer = Buffer.from(clean, "base64");
  return extractGpsFromBuffer(buffer);
}
