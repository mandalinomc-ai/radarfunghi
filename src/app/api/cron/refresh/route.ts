import { NextRequest, NextResponse } from "next/server";
import { formatDateISO } from "@/lib/dateUtils";
import { aggregateAllZoneWeather } from "@/lib/weatherAggregator";
import { writeWeatherCache } from "@/lib/weatherCache";
import { SERVER_CRON_INTERVAL_MIN } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Cron Vercel: aggiorna meteo ogni 10 min anche senza visitatori */
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = formatDateISO(new Date());

  try {
    const snapshot = await aggregateAllZoneWeather(today);
    await writeWeatherCache(snapshot);

    return NextResponse.json({
      ok: true,
      message: "Meteo multi-fonte aggiornato",
      today,
      fetchedAt: snapshot.fetchedAt,
      zones: snapshot.zoneCount,
      clusters: snapshot.clusterCount,
      sources: snapshot.sources,
      nextRunMinutes: SERVER_CRON_INTERVAL_MIN,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Cron refresh failed",
      },
      { status: 500 }
    );
  }
}
