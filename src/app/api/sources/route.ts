import { NextResponse } from "next/server";
import {
  OFFICIAL_DATA_SOURCES,
  type SourceStatus,
} from "@/lib/dataSources";
import { readWeatherCache } from "@/lib/weatherCache";
import { SERVER_CRON_INTERVAL_MIN } from "@/lib/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const cached = await readWeatherCache();
  const now = cached?.fetchedAt ?? new Date().toISOString();
  const ageMin = Math.round(
    (Date.now() - new Date(now).getTime()) / 60000
  );

  const sources: SourceStatus[] = OFFICIAL_DATA_SOURCES.map((src) => ({
    id: src.id,
    name: src.name,
    shortName: src.shortName,
    category: src.category,
    url: src.url,
    certified: src.certified,
    lastUpdate:
      src.id === "open-meteo" || src.id.startsWith("arpa")
        ? now
        : src.id === "funghimagazine"
          ? "2026-06-21T08:00:00.000Z"
          : null,
    status:
      src.id === "open-meteo"
        ? cached
          ? "live"
          : "cached"
        : src.category === "editoriale"
          ? "editorial"
          : cached
            ? "live"
            : "cached",
    ageMinutes:
      src.id === "open-meteo" || src.id.startsWith("arpa")
        ? ageMin
        : src.id === "funghimagazine"
          ? Math.max(
              0,
              Math.round(
                (Date.now() - new Date("2026-06-21").getTime()) / 60000
              )
            )
          : null,
  }));

  return NextResponse.json({
    fetchedAt: now,
    sources,
    certifiedCount: sources.filter((s) => s.certified).length,
    totalCount: sources.length,
    serverCronMinutes: SERVER_CRON_INTERVAL_MIN,
    cacheZones: cached?.zoneCount ?? 0,
  });
}
