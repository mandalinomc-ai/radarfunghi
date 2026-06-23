import { NextRequest, NextResponse } from "next/server";
import { classifyMushroomImage } from "@/lib/mushroomClassifier";
import {
  SPY_MUSHROOMS,
  buildSpyPredictionReport,
} from "@/lib/spyMushroomIntel";
import { extractGpsFromBase64 } from "@/lib/exifGps";
import { fetchOpenMeteoHistory } from "@/lib/openMeteoHistory";
import {
  isAllowedImageMime,
  isValidCoord,
  MAX_IMAGE_BASE64_LEN,
  rateLimitResponse,
} from "@/lib/security/apiGuard";
import { checkRateLimit, clientIp } from "@/lib/security/rateLimit";

const SPY_TITLES: Record<10 | 14 | 20, string> = {
  10: "Finestra 10 giorni (incubazione)",
  14: "Finestra 14 giorni (picco buttata)",
  20: "Finestra 20 giorni (mantenimento)",
};

export async function POST(req: Request) {
  const rl = checkRateLimit(`classify:${clientIp(req)}`, 8, 60_000);
  if (!rl.allowed) return rateLimitResponse(rl.retryAfterSec);

  try {
    const body = (await req.json()) as {
      imageBase64?: string;
      mimeType?: string;
      lat?: number;
      lng?: number;
    };

    if (!body.imageBase64) {
      return NextResponse.json({ error: "Immagine mancante" }, { status: 400 });
    }

    if (body.imageBase64.length > MAX_IMAGE_BASE64_LEN) {
      return NextResponse.json(
        { error: "Immagine troppo grande (max ~6 MB)" },
        { status: 413 }
      );
    }

    const mime = (body.mimeType ?? "image/jpeg").toLowerCase();
    if (!isAllowedImageMime(mime)) {
      return NextResponse.json({ error: "Formato non supportato" }, { status: 415 });
    }

    const result = await classifyMushroomImage(body.imageBase64, mime);

    let spyHorizons:
      | {
          days: number;
          title: string;
          forecast: string;
          confidence: string;
        }[]
      | undefined;
    let gpsFromPhoto: { lat: number; lng: number } | null = null;

    const clientLat =
      typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null;
    const clientLng =
      typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null;

    if (clientLat != null && clientLng != null && isValidCoord(clientLat, clientLng)) {
      gpsFromPhoto = { lat: clientLat, lng: clientLng };
    } else {
      gpsFromPhoto = await extractGpsFromBase64(body.imageBase64);
    }

    if (result.isSpyMushroom && result.spyId) {
      const spy = SPY_MUSHROOMS.find((s) => s.id === result.spyId);
      if (spy) {
        if (gpsFromPhoto && isValidCoord(gpsFromPhoto.lat, gpsFromPhoto.lng)) {
          try {
            const history = await fetchOpenMeteoHistory(
              gpsFromPhoto.lat,
              gpsFromPhoto.lng,
              1
            );
            const report = buildSpyPredictionReport(history, spy);
            spyHorizons = report.horizons.map((h) => ({
              days: h.days,
              title: SPY_TITLES[h.days as 10 | 14 | 20] ?? h.title,
              forecast: h.forecast,
              confidence: h.confidence,
            }));
          } catch {
            spyHorizons = fallbackSpyHorizons(spy.indicates);
          }
        } else {
          spyHorizons = fallbackSpyHorizons(spy.indicates);
        }
      }
    }

    return NextResponse.json({
      ...result,
      spyHorizons,
      gpsFromPhoto,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Errore classificazione" },
      { status: 500 }
    );
  }
}

function fallbackSpyHorizons(indicates: string) {
  return ([10, 14, 20] as const).map((days) => ({
    days,
    title: SPY_TITLES[days],
    forecast: indicates,
    confidence: days === 14 ? "alta" : "media",
  }));
}
