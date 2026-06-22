import { NextRequest, NextResponse } from "next/server";
import { formatDateISO } from "@/lib/dateUtils";
import { aggregateAllZoneWeather } from "@/lib/weatherAggregator";
import {
  isCacheFresh,
  readWeatherCache,
  writeWeatherCache,
} from "@/lib/weatherCache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const targetDate =
    request.nextUrl.searchParams.get("date") ?? formatDateISO(new Date());
  const force = request.nextUrl.searchParams.get("force") === "1";

  try {
    if (!force) {
      const cached = await readWeatherCache();
      if (
        cached &&
        isCacheFresh(cached) &&
        cached.targetDate === targetDate
      ) {
        return NextResponse.json({
          ...cached,
          fromCache: true,
        });
      }
    }

    const snapshot = await aggregateAllZoneWeather(targetDate);
    await writeWeatherCache(snapshot);

    return NextResponse.json({
      ...snapshot,
      fromCache: false,
    });
  } catch (error) {
    const cached = await readWeatherCache();
    if (cached) {
      return NextResponse.json({
        ...cached,
        fromCache: true,
        stale: true,
        warning:
          error instanceof Error ? error.message : "Errore aggiornamento live",
      });
    }
    return NextResponse.json(
      {
        error: "Weather fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
