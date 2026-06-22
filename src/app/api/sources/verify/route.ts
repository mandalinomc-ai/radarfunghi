import { NextResponse } from "next/server";
import {
  CERTIFIED_SOURCES,
  verifyAllSources,
  filterActiveSources,
  LEVEL_LABELS,
} from "@/lib/certifiedSources";
import {
  getCachedVerifications,
  setCachedVerifications,
  getCacheAgeMinutes,
} from "@/lib/sourceVerificationCache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const force = new URL(request.url).searchParams.get("force") === "1";

  let results = force ? null : getCachedVerifications();

  if (!results) {
    results = await verifyAllSources(CERTIFIED_SOURCES);
    setCachedVerifications(results);
  }

  const active = filterActiveSources(CERTIFIED_SOURCES, results);
  const byLevel = {
    ufficiale: results.filter((r) => r.level === "ufficiale").length,
    istituzionale: results.filter((r) => r.level === "istituzionale").length,
    editoriale: results.filter((r) => r.level === "editoriale").length,
    community: results.filter((r) => r.level === "community").length,
    non_verificato: results.filter((r) => r.level === "non_verificato").length,
  };

  return NextResponse.json({
    fetchedAt: new Date().toISOString(),
    cacheAgeMinutes: getCacheAgeMinutes(),
    total: CERTIFIED_SOURCES.length,
    activeCount: active.length,
    brokenCount: results.filter((r) => !r.urlReachable).length,
    byLevel,
    levelLabels: LEVEL_LABELS,
    verifications: results,
    activeSourceIds: active.map((s) => s.id),
  });
}
