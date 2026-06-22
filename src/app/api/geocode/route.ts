import { NextRequest, NextResponse } from "next/server";
import {
  isWithinItaly,
  isWithinSudItalia,
  scoreGeocodeResult,
  geocodeConfidenceFromType,
  validateOriginPoint,
  SUD_ITALIA_VIEWBOX,
} from "@/lib/positionValidation";

export const dynamic = "force-dynamic";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance?: number;
  boundingbox?: string[];
}

function mapSearchResult(item: NominatimResult) {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  const confidence = geocodeConfidenceFromType(item.type);
  return {
    id: String(item.place_id),
    name: item.display_name.split(",").slice(0, 3).join(", "),
    fullName: item.display_name,
    lat,
    lng,
    type: item.type,
    confidence,
    inSudItalia: isWithinSudItalia(lat, lng),
    inItaly: isWithinItaly(lat, lng),
    score: scoreGeocodeResult({
      lat,
      lng,
      type: item.type,
      importance: item.importance,
    }),
  };
}

function sortAndFilterResults(items: NominatimResult[]) {
  return items
    .map(mapSearchResult)
    .filter((r) => r.inItaly)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);
}

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lngParam = request.nextUrl.searchParams.get("lng");

  if (latParam && lngParam) {
    const lat = Number(latParam);
    const lng = Number(lngParam);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ results: [] }, { status: 400 });
    }

    const originCheck = validateOriginPoint({ lat, lng });
    if (!originCheck.valid) {
      return NextResponse.json(
        { results: [], error: originCheck.errors[0] },
        { status: 400 }
      );
    }

    try {
      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lng),
        format: "json",
        addressdetails: "1",
        zoom: "16",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?${params}`,
        {
          headers: {
            "User-Agent": "MushroomRadar/1.0 (https://radar-funghi.vercel.app)",
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );
      if (!res.ok) {
        return NextResponse.json({ results: [] }, { status: 502 });
      }
      const data = (await res.json()) as NominatimResult;
      if (!data.display_name) {
        return NextResponse.json({
          results: [
            {
              id: "gps",
              name: "La mia posizione",
              fullName: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
              lat,
              lng,
              type: "gps",
              confidence: "high" as const,
              inSudItalia: isWithinSudItalia(lat, lng),
              inItaly: true,
              score: 1,
            },
          ],
          source: "gps-reverse",
          warnings: originCheck.warnings,
        });
      }
      const mapped = mapSearchResult(data);
      return NextResponse.json({
        results: [mapped],
        source: "nominatim-reverse",
        warnings: originCheck.warnings,
      });
    } catch {
      return NextResponse.json({ results: [] }, { status: 502 });
    }
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const viewbox = [
    SUD_ITALIA_VIEWBOX.minLng,
    SUD_ITALIA_VIEWBOX.maxLat,
    SUD_ITALIA_VIEWBOX.maxLng,
    SUD_ITALIA_VIEWBOX.minLat,
  ].join(",");

  const params = new URLSearchParams({
    q: `${q}, Italia`,
    format: "json",
    addressdetails: "1",
    limit: "12",
    countrycodes: "it",
    viewbox,
    bounded: "0",
  });

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "MushroomRadar/1.0 (https://radar-funghi.vercel.app)",
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      return NextResponse.json({ results: [] }, { status: 502 });
    }

    const data = (await res.json()) as NominatimResult[];
    const results = sortAndFilterResults(data);

    return NextResponse.json({
      results,
      source: "nominatim",
      viewbox: SUD_ITALIA_VIEWBOX,
    });
  } catch {
    return NextResponse.json({ results: [] }, { status: 502 });
  }
}
