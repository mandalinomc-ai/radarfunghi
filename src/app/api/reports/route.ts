import { NextRequest, NextResponse } from "next/server";
import { addReport, getAllReports, saveReportPhoto } from "@/lib/reportStore";
import { processNewReport } from "@/lib/reportValidationEngine";
import type { MushroomReport, MushroomSpecies, ReportType } from "@/lib/types";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 6 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const VALID_SPECIES = new Set<MushroomSpecies | "sconosciuto">([
  "estatino",
  "galletto",
  "porcino",
  "sconosciuto",
]);

const VALID_TYPES = new Set<ReportType>(["spia", "bottata", "ritrovamento"]);

export async function GET() {
  try {
    const reports = await getAllReports();
    return NextResponse.json({ reports, count: reports.length });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Impossibile caricare le segnalazioni",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const photo = form.get("photo");
    const lat = Number(form.get("lat"));
    const lng = Number(form.get("lng"));
    const accuracyMeters = form.get("accuracyMeters");
    const reportType = String(form.get("reportType") ?? "ritrovamento");
    const species = String(form.get("species") ?? "sconosciuto");
    const note = String(form.get("note") ?? "").slice(0, 280);

    if (!(photo instanceof File) || photo.size === 0) {
      return NextResponse.json(
        { error: "Foto obbligatoria per pubblicare una segnalazione" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.has(photo.type) && !photo.name.match(/\.(jpe?g|png|webp|heic)$/i)) {
      return NextResponse.json(
        { error: "Formato foto non valido. Usa JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    if (photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json(
        { error: "Foto troppo grande (max 6 MB)" },
        { status: 400 }
      );
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json(
        { error: "Posizione GPS non valida" },
        { status: 400 }
      );
    }

    if (lat < 39 || lat > 43 || lng < 13 || lng > 17) {
      return NextResponse.json(
        { error: "La segnalazione deve essere nel Centro-Sud Italia coperto dall'app" },
        { status: 400 }
      );
    }

    if (!VALID_TYPES.has(reportType as ReportType)) {
      return NextResponse.json({ error: "Tipo segnalazione non valido" }, { status: 400 });
    }

    if (!VALID_SPECIES.has(species as MushroomSpecies | "sconosciuto")) {
      return NextResponse.json({ error: "Specie non valida" }, { status: 400 });
    }

    const id = `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const buffer = Buffer.from(await photo.arrayBuffer());
    const photoUrl = await saveReportPhoto(
      id,
      buffer,
      photo.type || "image/jpeg"
    );

    const report: MushroomReport = {
      id,
      lat,
      lng,
      accuracyMeters:
        accuracyMeters != null && accuracyMeters !== ""
          ? Math.round(Number(accuracyMeters))
          : null,
      photoUrl,
      reportType: reportType as ReportType,
      species: species as MushroomSpecies | "sconosciuto",
      note,
      createdAt: new Date().toISOString(),
      validationStatus: "pending",
    };

    const validation = await processNewReport(report);
    await addReport(validation.report);

    return NextResponse.json(
      {
        success: true,
        report: validation.report,
        validation: {
          status: validation.status,
          matchedZone: validation.matchedZone,
          reliabilityBonusApplied: validation.reliabilityBonusApplied,
          mastroMessage: validation.mastroMessage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Errore durante il salvataggio",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
