import { NextRequest, NextResponse } from "next/server";
import { fetchCitizenScienceSnapshot } from "@/lib/citizenScienceAggregator";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const force = request.nextUrl.searchParams.get("force") === "1";

  try {
    const snapshot = await fetchCitizenScienceSnapshot(force);
    return NextResponse.json({
      ...snapshot,
      observationCount: snapshot.observations.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Citizen science fetch failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 }
    );
  }
}
