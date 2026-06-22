import { NextRequest, NextResponse } from "next/server";
import { formatDateISO } from "@/lib/dateUtils";
import { OFFICIAL_DATA_SOURCES, type SourceStatus } from "@/lib/dataSources";
import { readWeatherCache } from "@/lib/weatherCache";
import { CLIENT_AUTO_REFRESH_MS, SERVER_CRON_INTERVAL_MIN } from "@/lib/constants";
import { getAllReports } from "@/lib/reportStore";
import { getAllZoneReliability } from "@/lib/zoneReliabilityStore";
import {
  computeAllZoneCrossMultipliers,
  getSharedCitizenSnapshot,
} from "@/lib/crossSourceIntel";
import { FUNGAL_ZONES } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const date =
    request.nextUrl.searchParams.get("date") ?? formatDateISO(new Date());
  const force = request.nextUrl.searchParams.get("force") === "1";

  const weatherUrl = `/api/weather?date=${date}${force ? "&force=1" : ""}`;
  const origin =
    request.nextUrl.origin ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  let weatherPayload: Record<string, unknown> | null = null;
  let weatherError: string | null = null;

  try {
    const res = await fetch(`${origin}${weatherUrl}`, { cache: "no-store" });
    if (res.ok) {
      weatherPayload = await res.json();
    } else {
      const err = await res.json().catch(() => ({}));
      weatherError =
        (err as { message?: string }).message ?? "Meteo non disponibile";
      const cached = await readWeatherCache();
      if (cached) weatherPayload = { ...cached, fromCache: true, stale: true };
    }
  } catch (e) {
    weatherError = e instanceof Error ? e.message : "Errore meteo";
    const cached = await readWeatherCache();
    if (cached) weatherPayload = { ...cached, fromCache: true, stale: true };
  }

  const reports = await getAllReports().catch(() => []);
  const zoneReliability = await getAllZoneReliability().catch(() => []);
  const citizenScience = await getSharedCitizenSnapshot(force).catch(() => null);
  const crossMultipliers = computeAllZoneCrossMultipliers(
    FUNGAL_ZONES,
    citizenScience
  );
  const fetchedAt =
    (weatherPayload?.fetchedAt as string) ?? new Date().toISOString();
  const ageMin = Math.round(
    (Date.now() - new Date(fetchedAt).getTime()) / 60000
  );

  const sources: SourceStatus[] = OFFICIAL_DATA_SOURCES.map((src) => ({
    id: src.id,
    name: src.name,
    shortName: src.shortName,
    category: src.category,
    url: src.url,
    certified: src.certified,
    lastUpdate:
      src.id === "open-meteo"
        ? fetchedAt
        : src.id === "funghimagazine"
          ? "2026-06-21T08:00:00.000Z"
          : src.id.startsWith("arpa")
            ? fetchedAt
            : null,
    status:
      src.id === "open-meteo"
        ? weatherError
          ? "cached"
          : "live"
        : src.id === "inaturalist" || src.id === "mushroom-observer"
          ? citizenScience
            ? "live"
            : "cached"
        : src.category === "editoriale" || src.category === "citizen-science"
          ? "editorial"
          : weatherError
            ? "cached"
            : "live",
    ageMinutes:
      src.id === "open-meteo" || src.id.startsWith("arpa")
        ? ageMin
        : src.id === "inaturalist" || src.id === "mushroom-observer"
          ? citizenScience
            ? Math.round(
                (Date.now() -
                  new Date(citizenScience.fetchedAt).getTime()) /
                  60000
              )
            : null
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
    date,
    today: formatDateISO(new Date()),
    fetchedAt,
    weather: weatherPayload,
    weatherError,
    sources,
    reportsCount: reports.length,
    zoneReliability,
    citizenScience: citizenScience
      ? {
          fetchedAt: citizenScience.fetchedAt,
          inatTotal: citizenScience.inatTotal,
          moTotal: citizenScience.moTotal,
          observationCount: citizenScience.observations.length,
        }
      : null,
    crossMultipliers,
    autoRefreshMs: CLIENT_AUTO_REFRESH_MS,
    serverCronMinutes: SERVER_CRON_INTERVAL_MIN,
    nextClientRefreshAt: new Date(
      Date.now() + CLIENT_AUTO_REFRESH_MS
    ).toISOString(),
  });
}
