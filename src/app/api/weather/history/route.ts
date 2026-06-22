import { NextRequest, NextResponse } from "next/server";
import {
  fetchOpenMeteoHistory,
  type HistoryMonths,
} from "@/lib/openMeteoHistory";

const VALID_MONTHS = new Set([1, 3, 6, 12]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const lat = Number(searchParams.get("lat") ?? 42.5);
  const lng = Number(searchParams.get("lng") ?? 12.5);
  const months = Number(searchParams.get("months") ?? 1) as HistoryMonths;

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ error: "Coordinate non valide" }, { status: 400 });
  }
  if (!VALID_MONTHS.has(months)) {
    return NextResponse.json(
      { error: "months deve essere 1, 3, 6 o 12" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchOpenMeteoHistory(lat, lng, months);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Errore meteo storico";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
