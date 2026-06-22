import { NextResponse } from "next/server";
import {
  CERTIFIED_SOURCES,
  CERTIFIED_SOURCE_COUNT,
  CATALOG_META,
  CATEGORY_LABELS,
  verifyAllSources,
  filterActiveSources,
} from "@/lib/certifiedSources";
import {
  getCachedVerifications,
  setCachedVerifications,
} from "@/lib/sourceVerificationCache";
import { VERIFIED_COORDS_LAST_REVIEW } from "@/lib/verifiedZoneCoords";
import { getCoordinateQualityStats } from "@/lib/zoneCoordinateService";
import { FUNGAL_ZONES } from "@/lib/mockData";
import { YOUTUBE_SOURCE_COUNT } from "@/lib/youtubeSources";

export const dynamic = "force-dynamic";

export async function GET() {
  const coordStats = getCoordinateQualityStats(FUNGAL_ZONES);

  let verifications = getCachedVerifications();
  if (!verifications) {
    verifications = await verifyAllSources(CERTIFIED_SOURCES);
    setCachedVerifications(verifications);
  }

  const active = filterActiveSources(CERTIFIED_SOURCES, verifications);

  const byCategory: Record<string, number> = {};
  for (const s of active) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
  }

  return NextResponse.json({
    catalog: CATALOG_META,
    certifiedCount: active.length,
    registryCount: CERTIFIED_SOURCE_COUNT,
    youtubeCount: YOUTUBE_SOURCE_COUNT,
    categories: CATEGORY_LABELS,
    countsByCategory: byCategory,
    brokenCount: verifications.filter((v) => !v.urlReachable).length,
    sources: active,
    coordinates: {
      ...coordStats,
      lastReview: VERIFIED_COORDS_LAST_REVIEW,
    },
    fetchedAt: new Date().toISOString(),
  });
}
