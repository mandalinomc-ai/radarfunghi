import { NextRequest, NextResponse } from "next/server";
import {
  parseMapsInput,
  validateMapsLocation,
} from "@/lib/mapsLinkParser";
import { addSpyZone, getAllSpyZones, removeSpyZone } from "@/lib/spyZoneStore";
import { enrichSpyZone } from "@/lib/spyZoneValidation";
import type { MushroomSpecies } from "@/lib/types";

export const dynamic = "force-dynamic";

const VALID_SPECIES = new Set<MushroomSpecies | "sconosciuto">([
  "estatino",
  "galletto",
  "porcino",
  "sconosciuto",
]);

export async function GET() {
  try {
    const zones = await getAllSpyZones();
    return NextResponse.json({ zones, count: zones.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Impossibile caricare le zone spia",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      input?: string;
      lat?: number;
      lng?: number;
      label?: string;
      note?: string;
      species?: string;
    };

    let lat = body.lat;
    let lng = body.lng;
    let sourceInput = body.input?.trim() ?? "";

    if (body.input?.trim()) {
      const parsed = parseMapsInput(body.input);
      if (!parsed) {
        return NextResponse.json(
          {
            error:
              "Link o coordinate non riconosciuti. Incolla un link Google Maps o lat,lng (es. 41.0689, 14.6623).",
          },
          { status: 400 }
        );
      }
      lat = parsed.lat;
      lng = parsed.lng;
      sourceInput = parsed.raw;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Coordinate mancanti o non valide" },
        { status: 400 }
      );
    }

    const validation = validateMapsLocation({
      lat: lat!,
      lng: lng!,
      source: "coordinates",
      raw: sourceInput,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const species = VALID_SPECIES.has(
      body.species as MushroomSpecies | "sconosciuto"
    )
      ? (body.species as MushroomSpecies | "sconosciuto")
      : "sconosciuto";

    const id = `spy_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const zone = enrichSpyZone(id, {
      lat: lat!,
      lng: lng!,
      label: String(body.label ?? "Zona spia interessante").slice(0, 120),
      note: String(body.note ?? "").slice(0, 400),
      sourceInput,
      species,
    });

    await addSpyZone(zone);

    return NextResponse.json({ success: true, zone }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Errore salvataggio zona spia",
        message: error instanceof Error ? error.message : "Unknown",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "ID mancante" }, { status: 400 });
  }
  const removed = await removeSpyZone(id);
  if (!removed) {
    return NextResponse.json({ error: "Zona non trovata" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
